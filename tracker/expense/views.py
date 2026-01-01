from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated

from datetime import date, timedelta

from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response

from .helpers import get_custom_month_range

from django.db.models import Sum
from datetime import date, timedelta
from .models import Expense, Category, userSetting  # Ensure these are imported
from .serializers import ExpenseSerializer

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
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        return Category.objects.filter(user_id = clerk_id)

    def perform_create(self, serializer):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        serializer.save(user_id = clerk_id)


# ---- TAG ----
class TagViewSet(ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        return Tag.objects.filter(user_id = clerk_id)

    def perform_create(self, serializer):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        serializer.save(user_id = clerk_id)


# ---- EXPENSE ----
class ExpenseViewSet(ModelViewSet):
    serializer_class = ExpenseSerializer
    # Permission is handled by Clerk Middleware + IsAuthenticated
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        queryset = Expense.objects.filter(user_id= clerk_id)

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
            queryset = queryset.filter(description__icontains=search)

        return queryset

    def perform_create(self, serializer):
        user_obj = getattr(self.request, 'clerk_user', None)

        if not user_obj or not hasattr(user_obj, 'id'):
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated("User identification failed. Please sign in again.")
    
        clerk_id = user_obj.id
    
        # Save the expense with the Clerk user ID
        expense = serializer.save(user_id=clerk_id)

        if not expense.description:
            return

        # Ask Gemini
        suggestion = suggest_category(
            description=expense.description,
            amount=float(expense.amount),
            model_name="gemini-2.5-flash"
        )

        # Extract and Save properly
        if suggestion and isinstance(suggestion, dict):
            cat_name = suggestion.get("category")
            if cat_name:
                # Create/Get the Category object
                category_obj, _ = Category.objects.get_or_create(
                    user_id=clerk_id,
                    name=cat_name.strip()
                )
                
                # Update the expense with BOTH the link and the name string
                expense.category = category_obj
                expense.category_name = category_obj.name
                expense.save()
                print(f"DEBUG: AI categorized '{expense.description}' as '{cat_name}'")

    def perform_update(self, serializer):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        try:
            expense = serializer.save()
            
            # Handle manual category assignment
            category_name = self.request.data.get('category_name')
            if category_name and category_name.strip():
                category, created = Category.objects.get_or_create(
                    user_id=clerk_id,
                    name=category_name.strip()
                )
                expense.category = category
                expense.save(update_fields=["category"])
            
            elif expense.description:
                # AI Suggestion if no manual category
                suggestion = suggest_category(
                    description=expense.description,
                    amount=float(expense.amount),
                )
                if suggestion:
                    cat_name = suggestion.get("category")
                    if cat_name:
                        category, created = Category.objects.get_or_create(
                            user_id=clerk_id,
                            name=cat_name.strip()
                        )
                        expense.category = category
                        expense.save(update_fields=["category"])
        except Exception as e:
            print(f"Error updating expense: {e}")
            raise

    @action(detail=False, methods=["get"])
    def summary(self, request):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        
        period = request.query_params.get("period", "monthly")
        today_str = request.query_params.get("date")
        
        # Check for explicit start and end parameters for dynamic range
        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")

        if today_str:
            try:
                ref_date = date.fromisoformat(today_str)
            except ValueError:
                return Response({"detail": "Invalid date format."}, status=400)
        else:
            ref_date = date.today()

        qs = Expense.objects.filter(user_id=clerk_id)

        # Dynamic range logic: use explicit start/end if provided, otherwise use period logic
        if start_param and end_param:
            try:
                start = date.fromisoformat(start_param)
                end = date.fromisoformat(end_param)
            except ValueError:
                return Response({"detail": "Invalid date format for start/end."}, status=400)
        elif period == "all":
            # Return data for user's entire history
            start = None
            end = None
        elif period == "weekly":
            start = ref_date - timedelta(days=ref_date.weekday())
            end = start + timedelta(days=6)
        else:
            # Monthly using user's specific settings stored by clerk_id
            start_day = 1
            try:
                settings = userSetting.objects.get(user_id=clerk_id)
                start_day = settings.month_start_date
            except userSetting.DoesNotExist:
                start_day = 1

            start, end = get_custom_month_range(ref_date, start_day)

        # Apply date filtering only if start and end are defined
        if start and end:
            qs_period = qs.filter(date__gte=start, date__lte=end)
        else:
            qs_period = qs
        
        total = qs_period.aggregate(total=Sum("amount"))["total"] or 0

        grouped = (
            qs_period.values("category__id", "category__name")
              .annotate(total=Sum("amount"))
              .order_by("-total")
        )

        by_category = [
            {
                "id": row["category__id"],
                "name": row["category__name"] or "Uncategorized",
                "total": row["total"],
            } for row in grouped
        ]

        return Response({
            "period": period, 
            "start": start.isoformat() if start else None, 
            "end": end.isoformat() if end else None,
            "total": total, 
            "by_category": by_category,
        })

    @action(detail=False, methods=["get"])
    def insights(self, request):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        
        period = request.query_params.get("period", "monthly")
        today_str = request.query_params.get("date")
        
        # Check for explicit start and end parameters for dynamic range
        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")

        if today_str:
            try:
                ref_date = date.fromisoformat(today_str)
            except ValueError:
                return Response({"detail": "Invalid date format."}, status=400)
        else:
            ref_date = date.today()

        qs = Expense.objects.filter(user_id=clerk_id)

        # Dynamic range logic: use explicit start/end if provided, otherwise use period logic
        if start_param and end_param:
            try:
                start = date.fromisoformat(start_param)
                end = date.fromisoformat(end_param)
                # For explicit date ranges, calculate previous period of same length
                period_len = (end - start).days + 1
                prev_start, prev_end = start - timedelta(days=period_len), start - timedelta(days=1)
            except ValueError:
                return Response({"detail": "Invalid date format for start/end."}, status=400)
        elif period == "all":
            # For "all time", use entire user history and no previous period comparison
            start = None
            end = None
            prev_start = None
            prev_end = None
        elif period == "weekly":
            start = ref_date - timedelta(days=ref_date.weekday())
            end = start + timedelta(days=6)
            prev_start, prev_end = start - timedelta(days=7), start - timedelta(days=1)
        else:
            # Monthly using user's specific settings stored by clerk_id
            start_day = 1
            try:
                settings = userSetting.objects.get(user_id=clerk_id)
                start_day = settings.month_start_date
            except userSetting.DoesNotExist:
                start_day = 1
            start, end = get_custom_month_range(ref_date, start_day)
            period_len = (end - start).days + 1
            prev_start, prev_end = start - timedelta(days=period_len), start - timedelta(days=1)

        # Apply date filtering only if start and end are defined
        if start and end:
            qs_period = qs.filter(date__gte=start, date__lte=end)
        else:
            # For "all time", use entire queryset
            qs_period = qs
            
        total = qs_period.aggregate(total=Sum("amount"))["total"] or 0

        if total == 0:
            return Response({
                "summary": {
                    "period": period, 
                    "start": start.isoformat() if start else None, 
                    "end": end.isoformat() if end else None, 
                    "total": 0, 
                    "by_category": []
                },
                "cards": {"total_spent": 0, "top_category": None},
                "insight": "No expenses found for this period. Start adding transactions to see AI insights!",
            })
        
        grouped = (
            qs_period.values("category__id", "category__name")
                     .annotate(total=Sum("amount"))
                     .order_by("-total")
        )
        by_category = [{"id": r["category__id"], "name": r["category__name"] or "Uncategorized", "total": r["total"]} for r in grouped]

        # AI Prep
        summary = {
            "period": period, 
            "start": start.isoformat() if start else None, 
            "end": end.isoformat() if end else None, 
            "total": float(total), 
            "by_category": by_category
        }
        
        # Calculate previous period total only if we have previous period dates
        if prev_start and prev_end:
            prev_total = qs.filter(date__gte=prev_start, date__lte=prev_end).aggregate(total=Sum("amount"))["total"] or 0
        else:
            prev_total = 0

        insight = None
        try:
            insight = generate_insights(summary, previous_total=float(prev_total))
            if isinstance(insight, dict) and "text" in insight:
                insight_text = insight["text"]
            else:
                insight_text = "Analysis is being prepared. Check back shortly!"
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print("AI Rate limit hit. Using fallback message.")
                insight = "AI Insights are temporarily unavailable due to high demand. Please try again in an hour."
            else:
                print(f"AI Error: {e}")
                insight = "Analysis currently unavailable."

        return Response({
            "summary": summary,
            "cards": {"total_spent": float(total), "top_category": by_category[0]["name"] if by_category else None},
            "insight": insight_text if 'insight_text' in locals() else insight,
        })

# ---- USER SETTINGS ----
class UserSettingsViewSet(ModelViewSet):
    serializer_class = UserSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Always return settings only for current user
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        return userSetting.objects.filter(user_id=clerk_id)
    
    def perform_create(self, serializer):
        user_obj = getattr(self.request, 'clerk_user', None)
        if user_obj:
            clerk_id = user_obj.id # clerk_id is now the string "user_2N..."
        else:
            return Response({"error": "No user found"}, status=401)
        # If settings already exist, don't let user create a second one
        if userSetting.objects.filter(user_id=clerk_id).exists():
            raise ValueError("Settings already exist for this user.")

        serializer.save(user_id=clerk_id)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
