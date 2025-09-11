from django.contrib import admin
from .models import Slide, Banner

@admin.register(Slide)
class SlideAdmin(admin.ModelAdmin):
    list_display  = ("id", "title", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    search_fields = ("title", "alt")
    list_filter   = ("is_active",)

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display  = ("id", "title", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    search_fields = ("title", "subtitle")
    list_filter   = ("is_active",)
