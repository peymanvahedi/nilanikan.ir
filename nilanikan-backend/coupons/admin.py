from django.contrib import admin
from .models import Coupon
@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code','percent_off','max_uses','used','active','starts_at','ends_at')
    search_fields = ('code',)
