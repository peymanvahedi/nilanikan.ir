import os
from typing import Optional, Tuple
from rest_framework import serializers
from .models import (
    Category,
    Product,
    ProductImage,
    ProductVideo,   # ← اضافه شد
    Bundle,
    BundleImage,
    BundleVideo,    # ← اضافه شد
    AttributeValue,
    ProductVariant,
)
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


def product_prices(obj: Product) -> Tuple[Optional[float], Optional[float]]:
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


# ------------------------- Category (General) -------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent"]


# ------------------------- Category (Detail for Frontend page header) -------------------------
class CategoryDetailSerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent", "icon", "image"]

    def get_icon(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "icon", None))) or ""

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None))) or ""


# ------------------------- Category (Menu Tree) -------------------------
class MenuCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "image", "children"]

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True, show_in_menu=True).order_by("menu_order", "name")
        return MenuCategorySerializer(qs, many=True, context=self.context).data


# ------------------------- Attribute Values -------------------------
class AttributeValueSerializer(serializers.ModelSerializer):
    attribute = serializers.CharField(source="attribute.name")

    class Meta:
        model = AttributeValue
        fields = ["id", "attribute", "value", "slug", "color_code"]


# ------------------------- Product Images -------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt", "order", "is_primary"]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Product Videos -------------------------
class ProductVideoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnailUrl = serializers.SerializerMethodField()

    class Meta:
        model = ProductVideo
        fields = ["id", "title", "url", "thumbnailUrl", "order", "is_primary", "created_at"]

    def get_url(self, obj):
        req = self.context.get("request")
        if getattr(obj, "file", None):
            return abs_url(req, safe_file_url(obj.file))
        return obj.external_url or ""

    def get_thumbnailUrl(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "thumbnail", None))) or ""


# ------------------------- Product Variants -------------------------
class ProductVariantSerializer(serializers.ModelSerializer):
    size = AttributeValueSerializer()

    class Meta:
        model = ProductVariant
        fields = ["id", "size", "price", "stock"]


# ------------------------- Product (Full/Admin) -------------------------
class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    gallery = ProductImageSerializer(many=True, read_only=True)
    videos = ProductVideoSerializer(many=True, read_only=True)  # ← اضافه شد
    is_recommended = serializers.BooleanField(read_only=False)
    attributes = AttributeValueSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category",
            "price", "discount_price", "description",
            "image", "gallery", "videos",    # ← ویدیوها
            "stock", "is_active", "is_recommended", "created_at",
            "attributes", "size_chart",
            "variants",
        ]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Product (Frontend/List Item) -------------------------
class ProductItemSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    compareAtPrice = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()
    is_recommended = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "title", "imageUrl", "image",
            "price", "compareAtPrice", "link", "badge",
            "is_recommended",
        ]

    def get_title(self, obj):
        return getattr(obj, "name", "") or str(obj.pk)

    def _img(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None))) or ""

    def get_imageUrl(self, obj):
        return self._img(obj)

    def get_image(self, obj):
        return self._img(obj)

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
        fields = ["id", "image", "alt", "order", "is_primary"]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


# ------------------------- Bundle Videos -------------------------
class BundleVideoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnailUrl = serializers.SerializerMethodField()

    class Meta:
        model = BundleVideo
        fields = ["id", "title", "url", "thumbnailUrl", "order", "is_primary", "created_at"]

    def get_url(self, obj):
        req = self.context.get("request")
        if getattr(obj, "file", None):
            return abs_url(req, safe_file_url(obj.file))
        return obj.external_url or ""

    def get_thumbnailUrl(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "thumbnail", None))) or ""


# ------------------------- Bundle -------------------------
class BundleSerializer(serializers.ModelSerializer):
    products = ProductItemSerializer(many=True, read_only=True)
    gallery = BundleImageSerializer(many=True, read_only=True)
    videos = BundleVideoSerializer(many=True, read_only=True)  # ← اضافه شد
    image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    is_recommended = serializers.BooleanField(read_only=False)

    class Meta:
        model = Bundle
        fields = [
            "id", "title", "slug",
            "products", "bundle_price", "image", "gallery", "images", "videos",  # ← ویدیوها
            "active", "is_recommended", "created_at",
        ]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))

    def get_images(self, obj):
        req = self.context.get("request")
        out = []
        cover = abs_url(req, safe_file_url(getattr(obj, "image", None)))
        if cover:
            out.append(cover)
        for gi in getattr(obj, "gallery", []).all() if hasattr(obj, "gallery") else []:
            url = abs_url(req, safe_file_url(getattr(gi, "image", None)))
            if url:
                out.append(url)
        seen = set()
        uniq = []
        for u in out:
            if u not in seen:
                uniq.append(u)
                seen.add(u)
        return uniq


# ------------------------- Story -------------------------
class StorySerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ["id", "title", "imageUrl", "link", "created_at"]

    def get_imageUrl(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None))) or ""
