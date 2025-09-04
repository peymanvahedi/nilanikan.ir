from rest_framework import serializers
from .models import CartItem, Order, OrderItem
from catalog.serializers import ProductSerializer
from catalog.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True, source='product')
    class Meta:
        model = CartItem
        fields = ['id','product','product_id','quantity','created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id','product','price','quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ['id','user','total_amount','status','address','tracking_code','created_at','items']
        read_only_fields = ['user','total_amount','status','created_at']
