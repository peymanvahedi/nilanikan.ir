from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "product_id",
        "product_slug",
        "name",
        "rating",
        "is_approved",
        "created_at",
    )
    list_filter = ("is_approved", "rating")
    search_fields = ("name", "comment", "product_slug")
    ordering = ("-created_at",)
