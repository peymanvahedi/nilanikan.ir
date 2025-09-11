from django.contrib import admin
from .models import CartItem, Order, OrderItem


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "product", "quantity", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "product__id")
    ordering = ("-id",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    fields = ("product", "price", "quantity")
    extra = 0
    autocomplete_fields = ("product",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total_amount", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("id", "user__username", "user__email")
    readonly_fields = ("items_subtotal", "total_amount", "created_at")
    date_hierarchy = "created_at"
    ordering = ("-id",)
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "product", "price", "quantity")
    search_fields = ("order__id", "product__id")
    autocomplete_fields = ("order", "product")
    ordering = ("-id",)
