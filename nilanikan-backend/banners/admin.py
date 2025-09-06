from django.contrib import admin
from .models import Slide

@admin.register(Slide)
class SlideAdmin(admin.ModelAdmin):
    list_display  = ("id", "title", "is_active", "order", "product")
    list_editable = ("is_active", "order")
    search_fields = ("title", "alt")
    list_filter   = ("is_active",)
