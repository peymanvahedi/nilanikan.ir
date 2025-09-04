from django.contrib import admin
from .models import CartItem, Order, OrderItem

admin.site.register(CartItem)
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id","user","total_amount","status","created_at")
    list_filter = ("status",)
    inlines = [OrderItemInline]
