# catalog/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category,
    Product,
    ProductImage,
    Bundle,
    BundleImage,
    Banner,
    Attribute,
    AttributeValue,
    ProductVariant,  # ← اضافه شد
)

# ---------------------------
# Category
# ---------------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "parent", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


# ---------------------------
# Product + Gallery Inline
# ---------------------------
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 2
    fields = ("preview", "image", "alt", "order", "is_primary")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if not obj or not getattr(obj, "image", None):
            return "—"
        try:
            return format_html(
                '<img src="{}" style="height:60px;border-radius:6px;object-fit:cover;"/>',
                obj.image.url,
            )
        except Exception:
            return "—"

    preview.short_description = "پیش‌نمایش"


# ---------------------------
# Product Variants Inline
# ---------------------------
class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    autocomplete_fields = ("size",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id", "name", "sku", "category",
        "price", "stock", "is_active", "is_recommended",
    )
    list_filter = ("is_active", "is_recommended", "category")
    list_editable = ("is_active", "is_recommended")
    search_fields = ("name", "sku", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]  # ← Variant اضافه شد
    filter_horizontal = ("attributes",)  # ⟵ مدیریت ویژگی‌های ساده


# ---------------------------
# Bundle + Gallery Inline
# ---------------------------
class BundleImageInline(admin.TabularInline):
    model = BundleImage
    extra = 3
    fields = ("preview", "image", "alt", "order", "is_primary")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if not obj or not getattr(obj, "image", None):
            return "—"
        try:
            return format_html(
                '<img src="{}" style="height:60px;border-radius:6px;object-fit:cover;"/>',
                obj.image.url,
            )
        except Exception:
            return "—"

    preview.short_description = "پیش‌نمایش"


@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "slug", "bundle_price",
        "active", "is_recommended", "created_at",
    )
    list_filter = ("active", "is_recommended")
    list_editable = ("active", "is_recommended")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("products",)
    inlines = [BundleImageInline]


# ---------------------------
# Banner
# ---------------------------
@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "alt", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    search_fields = ("alt",)
    list_filter = ("is_active",)


# ---------------------------
# Attribute & AttributeValue
# ---------------------------
@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "type")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("attribute", "value", "slug", "color_code")
    list_filter = ("attribute",)
    search_fields = ("value",)
    prepopulated_fields = {"slug": ("value",)}
