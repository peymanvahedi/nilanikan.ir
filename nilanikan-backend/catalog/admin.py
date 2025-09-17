from django.contrib import admin
from .models import MenuItem
from django.utils.html import format_html
from .models import (
    Category,
    Product,
    ProductImage,
    ProductVideo,  # ← اضافه شد
    Bundle,
    BundleImage,
    BundleVideo,   # ← اضافه شد
    Banner,
    Attribute,
    AttributeValue,
    ProductVariant,
)

# ---------------------------
# Category (منوی قابل مدیریت)
# ---------------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id", "name", "slug", "parent",
        "show_in_menu", "is_active", "menu_order",
        "icon", "image_thumb", "created_at",
    )
    list_editable = ("show_in_menu", "is_active", "menu_order")
    list_filter = ("show_in_menu", "is_active", "parent")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        ("اطلاعات اصلی", {
            "fields": ("name", "slug", "description", "parent")
        }),
        ("تنظیمات منو", {
            "fields": (
                "show_in_menu", "is_active", "menu_order",
                "icon", "image", "image_thumb_readonly",
            )
        }),
        ("متادیتا", {
            "fields": ("created_at",),
        }),
    )
    readonly_fields = ("created_at", "image_thumb_readonly")

    def image_thumb(self, obj):
        if getattr(obj, "image", None):
            try:
                return format_html(
                    '<img src="{}" style="height:34px;border-radius:6px;object-fit:cover;" />',
                    obj.image.url,
                )
            except Exception:
                return "—"
        return "—"
    image_thumb.short_description = "تصویر"

    def image_thumb_readonly(self, obj):
        # برای نمایش پیش‌نمایش در فرم جزئیات
        return self.image_thumb(obj)
    image_thumb_readonly.short_description = "پیش‌نمایش تصویر"


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


class ProductVideoInline(admin.TabularInline):
    model = ProductVideo
    extra = 1
    fields = ("preview", "file", "external_url", "thumbnail", "title", "order", "is_primary")
    readonly_fields = ("preview",)

    def preview(self, obj):
        # اگر کاور هست نشان بده؛ وگرنه لینک فایل/خارجی
        thumb = getattr(obj, "thumbnail", None)
        if thumb:
            try:
                return format_html('<img src="{}" style="height:60px;border-radius:6px;object-fit:cover;"/>', thumb.url)
            except Exception:
                pass
        if obj and (obj.file or obj.external_url):
            try:
                return obj.external_url or obj.file.url
            except Exception:
                return obj.external_url or "—"
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
    inlines = [ProductImageInline, ProductVideoInline, ProductVariantInline]  # ← ویدیو اضافه شد
    filter_horizontal = ("attributes",)


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


class BundleVideoInline(admin.TabularInline):
    model = BundleVideo
    extra = 1
    fields = ("preview", "file", "external_url", "thumbnail", "title", "order", "is_primary")
    readonly_fields = ("preview",)

    def preview(self, obj):
        thumb = getattr(obj, "thumbnail", None)
        if thumb:
            try:
                return format_html('<img src="{}" style="height:60px;border-radius:6px;object-fit:cover;"/>', thumb.url)
            except Exception:
                pass
        if obj and (obj.file or obj.external_url):
            try:
                return obj.external_url or obj.file.url
            except Exception:
                return obj.external_url or "—"
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
    inlines = [BundleImageInline, BundleVideoInline]  # ← ویدیو اضافه شد


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


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("id","name","parent","device","sort_order","is_active")
    list_editable = ("device","sort_order","is_active")
    list_filter   = ("device","is_active","parent")
    search_fields = ("name","slug","url")
    autocomplete_fields = ("parent","category")
    prepopulated_fields = {"slug": ("name",)}