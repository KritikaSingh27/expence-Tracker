
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny

from datetime import date, timedelta

from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response

from .helpers import get_custom_month_range


from .models import Category, Tag, Expense, userSetting
from .serializers import (
    CategorySerializer,
    TagSerializer,
    ExpenseSerializer,
    UserSettingSerializer,
)

from .ai.client import suggest_category, generate_insights
from .models import Category

# ---- CATEGORY ----
class CategoryViewSet(ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---- TAG ----
class TagViewSet(ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---- EXPENSE ----
class ExpenseViewSet(ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Base queryset: only current user's expenses
        queryset = Expense.objects.all()

        # GET parameters for filtering
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        category = self.request.query_params.get("category")
        tag = self.request.query_params.get("tag")
        search = self.request.query_params.get("search")

        if start:
            queryset = queryset.filter(date__gte=start)
        if end:
            queryset = queryset.filter(date__lte=end)
        if category:
            queryset = queryset.filter(category__id=category)
        if tag:
            queryset = queryset.filter(tag__id=tag)
        if search:
            # search within the description text
            queryset = queryset.filter(description__icontains=search)

        return queryset

    def perform_create(self, serializer):
        # 1) Save the expense with the current user
        expense = serializer.save()

        # 2) If there's no description, we can't guess a category
        if not expense.description:
            return

        # 3) Ask Gemini for a category suggestion
        suggestion = suggest_category(
            description=expense.description,
            amount=float(expense.amount),
        )

        if not suggestion:
            return

        cat_name = suggestion.get("category")
        if not cat_name:
            return

        # 4) Find or create a Category with this name for this user
        category = Category.objects.filter(
            user=self.request.user,
            name__iexact=cat_name.strip()
        ).first()

        if category is None:
            category = Category.objects.create(
                user=self.request.user,
                name=cat_name.strip()
            )

        # 5) Attach the category to the expense
        expense.category = category
        expense.save(update_fields=["category"])


    @action(detail=False, methods=["get"])
    def summary(self, request):
        # Return total expense for a given period (weekly or monthly).

        period = request.query_params.get("period", "monthly")  # "weekly" or "monthly"
        today_str = request.query_params.get("date")  # optional: YYYY-MM-DD

        if today_str:
            try:
                year, month, day = map(int, today_str.split("-"))
                ref_date = date(year, month, day)
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Use YYYY-MM-DD."},
                    status=400,
                )
        else:
            ref_date = date.today()

        # base queryset: all expenses (no auth needed in this demo setup)
        qs = Expense.objects.all()

        # determine date range
        if period == "weekly":
            # Monday to Sunday week
            start = ref_date - timedelta(days=ref_date.weekday())  # Monday
            end = start + timedelta(days=6)  # Sunday
        else:
            # default: monthly using user's settings
            try:
                settings = userSetting.objects.get(user=request.user)
                start_day = settings.month_start_date
            except userSetting.DoesNotExist:
                start_day = 1

            start, end = get_custom_month_range(ref_date, start_day)

        # filter expenses
        qs = qs.filter(date__gte=start, date__lte=end)

        # total amount
        total = qs.aggregate(total=Sum("amount"))["total"] or 0

        # ---- category-wise totals ----
        grouped = (
            qs.values("category__id", "category__name")
              .annotate(total=Sum("amount"))
              .order_by("-total")
        )

        by_category = []
        for row in grouped:
            cat_id = row["category__id"]       # can be None
            cat_name = row["category__name"]   # can be None
            if cat_name is None:
                cat_name = "Uncategorized"
            by_category.append({
                "id": cat_id,
                "name": cat_name,
                "total": row["total"],
            })

        data = {
            "period": period,
            "start": start,
            "end": end,
            "total": total,
            "by_category": by_category,
        }
        return Response(data)
    
    @action(detail=False, methods=["get"])
    def insights(self, request):

        # Compute the same summary as summary() then call generate_insights() and return both summary and insight text.
        
        period = request.query_params.get("period", "monthly")
        today_str = request.query_params.get("date")

        # parse date if provided, else use today
        if today_str:
            try:
                year, month, day = map(int, today_str.split("-"))
                ref_date = date(year, month, day)
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        else:
            ref_date = date.today()

        # base queryset: all expenses (no auth needed in this demo setup)
        qs = Expense.objects.all()

        # determine date range
        if period == "weekly":
            start = ref_date - timedelta(days=ref_date.weekday())
            end = start + timedelta(days=6)
            # previous period:
            prev_start = start - timedelta(days=7)
            prev_end = start - timedelta(days=1)
        else:
            # monthly
            try:
                settings = userSetting.objects.get(user=request.user)
                start_day = settings.month_start_date
            except userSetting.DoesNotExist:
                start_day = 1

            start, end = get_custom_month_range(ref_date, start_day)
            # compute previous period by shifting back by period length
            period_len = (end - start).days + 1
            prev_start = start - timedelta(days=period_len)
            prev_end = start - timedelta(days=1)

        # filter expenses in this range
        qs_period = qs.filter(date__gte=start, date__lte=end)
        total = qs_period.aggregate(total=Sum("amount"))["total"] or 0

        # group by category
        grouped = (
            qs_period.values("category__id", "category__name")
                     .annotate(total=Sum("amount"))
                     .order_by("-total")
        )
        by_category = []
        for row in grouped:
            cat_name = row.get("category__name") or "Uncategorized"
            by_category.append({"id": row.get("category__id"), "name": cat_name, "total": row.get("total")})

        category_chart = {
            "labels": [c["name"] for c in by_category],
            "values": [c["total"] for c in by_category],
        }

        daily_qs = (
            qs_period
            .values("date")
            .annotate(total=Sum("amount"))
            .order_by("date")
        )

        daily_trend = {
            "dates": [str(row["date"]) for row in daily_qs if row["date"]],
            "amounts": [float(row["total"]) for row in daily_qs if row["date"]],
        }

        summary_cards = {
            "total_spent": float(total),
            "top_category": by_category[0]["name"] if by_category else None,
        }

        summary = {
            "period": period,
            "start": start,
            "end": end,
            "total": float(total),
            "by_category": by_category,
        }

        # compute previous total across all expenses
        prev_total = Expense.objects.filter(date__gte=prev_start, date__lte=prev_end).aggregate(total=Sum("amount"))["total"] or 0

        # ask AI
        insight = generate_insights(summary, previous_total=float(prev_total))

        return Response({
            "summary": summary,
            "charts": {
                "category_breakdown": category_chart,
                "daily_trend": daily_trend,
            },
            "cards": summary_cards,
            "insight": insight,
        })




# ---- USER SETTINGS ----
class UserSettingsViewSet(ModelViewSet):
    serializer_class = UserSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Always return settings only for current user
        return userSetting.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If settings already exist, don't let user create a second one
        if userSetting.objects.filter(user=self.request.user).exists():
            raise ValueError("Settings already exist for this user.")

        serializer.save(user=self.request.user)
