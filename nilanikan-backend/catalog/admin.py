from django.contrib import admin
from django.db.models import JSONField
from django.forms import Textarea
from django.utils.html import format_html

from .models import Category, Product, Bundle, BundleImage


# ---------- Category ----------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


# ---------- Product ----------
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "price", "is_active", "created_at")
    search_fields = ("name", "sku", "slug")
    list_filter = ("is_active", "category", "created_at")
    prepopulated_fields = {"slug": ("name",)}

    fields = (
        "name", "slug", "sku", "category",
        "price", "discount_price",
        "description", "image",
        "stock", "is_active",
        "attributes",
        "size_chart",
        "created_at",
    )
    readonly_fields = ("created_at",)

    formfield_overrides = {
        JSONField: {"widget": Textarea(attrs={"rows": 10, "cols": 100})},
    }


# ---------- Bundle / Gallery ----------
class BundleImageInline(admin.TabularInline):
    model = BundleImage
    extra = 1
    fields = ("image", "preview",)
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj and obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:6px;" />', obj.image.url)
        return "—"
    preview.short_description = "پیش‌نمایش"


@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "bundle_price", "active", "created_at", "image_thumb", "products_count")
    search_fields = ("title", "slug")
    list_filter = ("active", "created_at")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("products",)
    inlines = [BundleImageInline]

    # فرم اصلی شامل تصویر اصلی هم باشد
    fields = (
        "title",
        "slug",
        "products",
        "bundle_price",
        "active",
        "image",        # 👈 تصویر اصلی باندل
        "created_at",
    )
    readonly_fields = ("created_at",)

    # پیش‌نمایش کوچک در لیست
    def image_thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', obj.image.url)
        return "—"
    image_thumb.short_description = "تصویر"

    def products_count(self, obj):
        return obj.products.count()
    products_count.short_description = "تعداد آیتم‌ها"
