from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name
    
class Tag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Expense(models.Model):
    # In this setup we allow user to be null so API can be used without auth
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(decimal_places= 2, max_digits= 5)
    description = models.TextField(null=True, blank= True)
    date = models.DateField(null=True, blank=True)
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    tag = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.desc or 'Expense'} - {self.amount}"

class userSetting(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    month_start_date = models.PositiveIntegerField(default= 1)

    def __str__(self):
        return f"Settings for {self.user.username}"