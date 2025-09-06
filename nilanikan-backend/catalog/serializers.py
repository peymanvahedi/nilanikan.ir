import os
from typing import Optional
from rest_framework import serializers
from .models import Category, Product, ProductImage, Bundle, BundleImage
from stories.models import Story


# ------------------------- Helpers -------------------------

def abs_url(request, url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    base = (os.getenv("PUBLIC_BASE_URL") or "").rstrip("/")
    if base:
        return f"{base}{url}"
    if request is not None:
        return request.build_absolute_uri(url)
    return url


def product_link(obj: Product) -> str:
    return f"/product/{obj.slug}/" if getattr(obj, "slug", None) else f"/product/{obj.pk}/"


def product_prices(obj: Product) -> tuple[Optional[float], Optional[float]]:
    price = getattr(obj, "price", None)
    discount = getattr(obj, "discount_price", None)
    if discount and float(discount) > 0:
        return float(discount), float(price) if price is not None else None
    return float(price) if price is not None else None, None


def safe_file_url(f) -> str:
    """برگشت url فقط اگر فایل واقعا وجود داشت"""
    try:
        if f and getattr(f, "name", ""):
            return f.url
    except Exception:
        pass
    return ""


# ------------------------- Category -------------------------

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent"]


# ------------------------- Product Images -------------------------

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt"]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Product (Full/Admin) -------------------------

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    gallery = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category",
            "price", "discount_price", "description",
            "image", "gallery",
            "stock", "is_active", "created_at",
            "attributes", "size_chart",
        ]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Product (Frontend/List Item) -------------------------

class ProductItemSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    compareAtPrice = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "title", "imageUrl", "price", "compareAtPrice", "link", "badge"]

    def get_title(self, obj):
        return getattr(obj, "name", "") or str(obj.pk)

    def get_imageUrl(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None))) or ""

    def get_price(self, obj):
        price, _compare = product_prices(obj)
        return price or 0

    def get_compareAtPrice(self, obj):
        _price, compare = product_prices(obj)
        return compare

    def get_link(self, obj):
        return product_link(obj)

    def get_badge(self, obj):
        price = getattr(obj, "price", None)
        discount = getattr(obj, "discount_price", None)
        if price and discount and float(price) > 0 and float(discount) < float(price):
            try:
                off = int(round((1 - float(discount) / float(price)) * 100))
                return f"{off}% OFF"
            except Exception:
                return "OFF"
        return None


# ------------------------- Bundle Images -------------------------

class BundleImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = BundleImage
        fields = ["id", "image"]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Bundle -------------------------

class BundleSerializer(serializers.ModelSerializer):
    products = ProductItemSerializer(many=True, read_only=True)
    gallery = BundleImageSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Bundle
        fields = [
            "id", "title", "slug",
            "products", "bundle_price", "image", "gallery",
            "active", "created_at",
        ]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Story -------------------------

class StorySerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ["id", "title", "imageUrl", "link", "created_at"]

    def get_imageUrl(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None))) or ""
