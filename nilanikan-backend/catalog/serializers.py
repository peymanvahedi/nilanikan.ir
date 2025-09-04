from rest_framework import serializers
from .models import Category, Product, Bundle, BundleImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category",
            "price", "discount_price", "description",
            "image", "stock", "is_active", "created_at",
            "attributes", "size_chart",
        ]


class BundleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "slug", "image", "price", "attributes"]


class BundleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BundleImage
        fields = ["id", "image"]


class BundleSerializer(serializers.ModelSerializer):
    products = BundleProductSerializer(many=True, read_only=True)
    gallery  = BundleImageSerializer(many=True, read_only=True)   # ✅
    image    = serializers.ImageField(read_only=True)             # ✅

    class Meta:
        model  = Bundle
        fields = [
            "id", "title", "slug",
            "products",
            "bundle_price",
            "image", "gallery",       # ✅
            "active", "created_at",
        ]
