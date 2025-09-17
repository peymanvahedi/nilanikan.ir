from rest_framework import serializers
from .models import CartItem, Order, OrderItem
from catalog.models import Product
from catalog.serializers import ProductSerializer  # اگر دارید


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source="product",
        label="Product ID",
    )

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity", "created_at"]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("حداقل تعداد باید ۱ باشد.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "price", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "user", "status", "address",
            # "postal_code",  ← حذف شد
            "shipping_method", "shipping_cost",
            "items_subtotal", "total_amount",
            "tracking_code", "created_at", "items",
        ]
        read_only_fields = ["user", "status", "items_subtotal", "total_amount", "created_at"]
