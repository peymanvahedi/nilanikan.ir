import os
from typing import Optional, Tuple

from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductImage,
    ProductVideo,
    Bundle,
    BundleImage,
    BundleVideo,
    AttributeValue,
    ProductVariant,
    MenuItem,
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


def safe_file_url(f) -> str:
    try:
        if f and getattr(f, "name", ""):
            return f.url
    except Exception:
        pass
    return ""


def variant_min_price(obj: Product) -> Optional[float]:
    try:
        variants = getattr(obj, "variants", None)
        if not variants:
            return None
        qs = variants.all() if hasattr(variants, "all") else variants

        with_stock = [float(v.price) for v in qs if (getattr(v, "stock", 0) or 0) > 0 and v.price is not None]
        if with_stock:
            return min(with_stock)

        all_prices = [float(v.price) for v in qs if v.price is not None]
        return min(all_prices) if all_prices else None
    except Exception:
        return None


def variant_total_stock(obj: Product) -> Optional[int]:
    try:
        variants = getattr(obj, "variants", None)
        if not variants:
            return None
        qs = variants.all() if hasattr(variants, "all") else variants
        counted = [int(getattr(v, "stock", 0) or 0) for v in qs]
        return sum(counted) if counted else 0
    except Exception:
        return None


def product_prices(obj: Product) -> Tuple[Optional[float], Optional[float]]:
    price = getattr(obj, "price", None)
    discount = getattr(obj, "discount_price", None)

    if price is not None and float(price) > 0:
        if discount and float(discount) > 0 and float(discount) < float(price):
            return float(discount), float(price)
        return float(price), None

    vmin = variant_min_price(obj)
    if vmin is not None:
        return float(vmin), None

    return None, None


# ------------------------- Category -------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent"]


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
    color = AttributeValueSerializer()
    size = AttributeValueSerializer()

    class Meta:
        model = ProductVariant
        fields = ["id", "color", "size", "price", "stock"]


# ------------------------- Product -------------------------
class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    gallery = ProductImageSerializer(many=True, read_only=True)
    videos = ProductVideoSerializer(many=True, read_only=True)
    is_recommended = serializers.BooleanField(read_only=False)

    attributes = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    stock = serializers.SerializerMethodField()

    # --- فیلدهای راهنمای سایز (flat) ---
    size_chart_image = serializers.SerializerMethodField()
    size_guide_url   = serializers.SerializerMethodField()
    size_guide_html  = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    size_guide_title = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    # --- fallback/meta برای فرانت ---
    meta = serializers.SerializerMethodField()
    # ------------------------------------

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category",
            "price", "discount_price", "description",
            "image", "gallery", "videos",
            "stock", "is_active", "is_recommended", "created_at",
            "attributes", "size_chart", "variants",
            # فیلدهای راهنمای سایز
            "size_guide_title", "size_guide_html", "size_guide_url", "size_chart_image",
            # fallback/meta
            "meta",
        ]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))

    def get_stock(self, obj):
        total = variant_total_stock(obj)
        return getattr(obj, "stock", None) if total is None else total

    def get_attributes(self, obj):
        variants = getattr(obj, "variants", None)
        if not variants:
            return []
        qs = variants.all() if hasattr(variants, "all") else variants
        groups, seen = {}, set()

        def push(av: AttributeValue):
            if not av:
                return
            attr_name = getattr(av.attribute, "name", "") or "ویژگی"
            key = (attr_name, av.id)
            if key in seen:
                return
            seen.add(key)
            groups.setdefault(attr_name, {"attribute": attr_name, "values": []})
            groups[attr_name]["values"].append({
                "id": av.id,
                "label": av.value,
                "value": av.slug or av.value,
                "color": av.color_code,
            })

        for v in qs:
            push(getattr(v, "color", None))
            push(getattr(v, "size", None))
        return list(groups.values())

    # -------- helpers for size guide --------
    def get_size_chart_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "size_chart_image", None))) or None

    def get_size_guide_url(self, obj):
        req = self.context.get("request")
        url = getattr(obj, "size_guide_url", None) or \
              getattr(getattr(obj, "category", None), "default_size_guide_url", None)
        return abs_url(req, url) if url else None

    def get_meta(self, obj):
        """
        اگر محصول خودش راهنمای سایز ندارد، از دسته‌بندی fallback بدهیم.
        فرانت شما در ProductQuickView به product.meta.* هم نگاه می‌کند.
        """
        # اگر خود محصول مقدار دارد، meta می‌تواند خالی باشد (فرانت اولویت را به فیلدهای flat می‌دهد)
        if obj.size_guide_html or obj.size_guide_url or obj.size_chart_image:
            return {
                "size_guide_html": obj.size_guide_html,
                "size_guide_url": self.get_size_guide_url(obj),
                "size_chart_image": self.get_size_chart_image(obj),
                "size_guide_title": obj.size_guide_title,
            }

        cat: Category = getattr(obj, "category", None)
        if not cat:
            return None

        # Fallback از Category
        data = {}
        if getattr(cat, "default_size_guide_url", None):
            data["size_guide_url"] = cat.default_size_guide_url
        if getattr(cat, "default_size_guide_title", None):
            data["size_guide_title"] = cat.default_size_guide_title

        # در حال حاضر Category فیلد html/image ندارد؛ اگر بعداً اضافه شد، اینجا مشابه بالا اضافه کنید.
        return data or None


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
            "id",
            "title",
            "imageUrl",
            "image",
            "price",
            "compareAtPrice",
            "link",
            "badge",
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
        p, _ = product_prices(obj)
        return p or 0

    def get_compareAtPrice(self, obj):
        _, cmp_ = product_prices(obj)
        return cmp_

    def get_link(self, obj):
        return product_link(obj)

    def get_badge(self, obj):
        price = getattr(obj, "price", None)
        discount = getattr(obj, "discount_price", None)
        try:
            if price and float(price) > 0 and discount and float(discount) > 0 and float(discount) < float(price):
                off = int(round((1 - float(discount) / float(price)) * 100))
                return f"{off}% OFF"
        except Exception:
            return "OFF"
        return None


# ------------------------- Bundle -------------------------
class BundleImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = BundleImage
        fields = ["id", "image", "alt", "order", "is_primary"]

    def get_image(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "image", None)))


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


class BundleSerializer(serializers.ModelSerializer):
    products = ProductItemSerializer(many=True, read_only=True)
    gallery = BundleImageSerializer(many=True, read_only=True)
    videos = BundleVideoSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    is_recommended = serializers.BooleanField(read_only=False)

    class Meta:
        model = Bundle
        fields = [
            "id",
            "title",
            "slug",
            "products",
            "bundle_price",
            "image",
            "gallery",
            "images",
            "videos",
            "active",
            "is_recommended",
            "created_at",
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
        if hasattr(obj, "gallery"):
            for gi in obj.gallery.all():
                url = abs_url(req, safe_file_url(getattr(gi, "image", None)))
                if url:
                    out.append(url)
        seen, uniq = set(), []
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


# ------------------------- MenuItem (Navigation) -------------------------
class MenuItemSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="name")
    href = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ["id", "label", "href", "icon", "children"]

    def get_href(self, obj):
        if obj.url:
            return obj.url if obj.url.startswith("/") else f"/{obj.url}"
        if obj.category_id and obj.category.slug:
            return f"/category/{obj.category.slug}"
        if obj.slug:
            return f"/category/{obj.slug}"
        return None

    def get_icon(self, obj):
        req = self.context.get("request")
        return abs_url(req, safe_file_url(getattr(obj, "icon", None))) or None

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True).order_by("sort_order", "id")
        return MenuItemSerializer(qs, many=True, context=self.context).data
