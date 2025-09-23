from django.contrib import admin
from django.utils.html import format_html
from django.utils.formats import number_format
from django import forms

from .models import (
    MenuItem,
    Category,
    Product,
    ProductImage,
    ProductVideo,
    Bundle,
    BundleImage,
    BundleVideo,
    Banner,
    Attribute,
    AttributeValue,
    ProductVariant,
)

# =========================
# Category (منوی قابل مدیریت)
# =========================
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
        ("اطلاعات اصلی", {"fields": ("name", "slug", "description", "parent")}),
        ("تنظیمات منو", {
            "fields": ("show_in_menu", "is_active", "menu_order", "icon", "image", "image_thumb_readonly")
        }),
        ("راهنمای سایز پیش‌فرض", {
            "fields": ("default_size_guide_title", "default_size_guide_url")
        }),
        ("متادیتا", {"fields": ("created_at",)}),
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
        return self.image_thumb(obj)
    image_thumb_readonly.short_description = "پیش‌نمایش تصویر"


# =========================
# Product + Gallery Inline
# =========================
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


# =========================
# Product Variants Inline (سطرِ ترکیب رنگ+سایز)
# =========================
class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ("color", "size", "price", "stock")
    autocomplete_fields = ("color", "size")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "color":
            kwargs["queryset"] = AttributeValue.objects.filter(
                attribute__type=Attribute.COLOR
            )
        elif db_field.name == "size":
            kwargs["queryset"] = AttributeValue.objects.filter(
                attribute__name__in=["سایز", "Size", "size", "اندازه"]
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# -------------------------
# فرم ادمینِ Product
# -------------------------
class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        def normalize_decimal(value):
            try:
                v = value.normalize()
                return format(v, "f")
            except Exception:
                return value

        if self.instance and getattr(self.instance, "pk", None):
            if "price" in self.fields and getattr(self.instance, "price", None) is not None:
                self.initial["price"] = normalize_decimal(self.instance.price)
            if "discount_price" in self.fields and getattr(self.instance, "discount_price", None) is not None:
                self.initial["discount_price"] = normalize_decimal(self.instance.discount_price)

        for fname in ("price", "discount_price"):
            if fname in self.fields:
                self.fields[fname].localize = True
                self.fields[fname].widget.is_localized = True
                self.fields[fname].widget.attrs.update({
                    "inputmode": "decimal",
                    "step": "0.01",
                    "min": "0",
                })


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductForm

    list_display = (
        "id", "name", "sku", "category",
        "price_display", "stock", "is_active", "is_recommended",
    )
    list_filter = ("is_active", "is_recommended", "category")
    list_editable = ("is_active", "is_recommended")
    search_fields = ("name", "sku", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVideoInline, ProductVariantInline]
    filter_horizontal = ("attributes",)

    fieldsets = (
        ("اطلاعات اصلی", {
            "fields": ("name", "slug", "sku", "category", "description", "image")
        }),
        ("قیمت", {
            "fields": ("price", "discount_price")
        }),
        ("راهنمای سایز", {
            # ➜ این بخش کامل شد تا HTML و تصویر هم داشته باشد
            "fields": ("size_guide_title", "size_guide_html", "size_guide_url", "size_chart_image")
        }),
        ("ویژگی‌ها و جدول سایز", {
            "fields": ("attributes", "size_chart")
        }),
        ("وضعیت و موجودی", {
            "fields": ("stock", "is_active", "is_recommended")
        }),
    )

    def price_display(self, obj):
        if getattr(obj, "price", None) is None:
            return "—"
        return number_format(obj.price, decimal_pos=None, use_l10n=True)
    price_display.short_description = "قیمت"


# =========================
# Bundle + Gallery Inline
# =========================
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
    inlines = [BundleImageInline, BundleVideoInline]


# =========================
# Banner
# =========================
@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "alt", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    search_fields = ("alt",)
    list_filter = ("is_active",)


# =========================
# Attribute & AttributeValue (مثل وردپرس)
# =========================
class AttributeValueInline(admin.TabularInline):
    model = AttributeValue
    extra = 3
    prepopulated_fields = {"slug": ("value",)}

    def get_fields(self, request, obj=None):
        base = ["value", "slug"]
        if obj and obj.type == Attribute.COLOR:
            base.append("color_code")
        return base


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "type")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [AttributeValueInline]


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("attribute", "value", "slug", "color_code")
    list_filter = ("attribute",)
    search_fields = ("value",)
    prepopulated_fields = {"slug": ("value",)}


# =========================
# MenuItem
# =========================
@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parent", "device", "sort_order", "is_active")
    list_editable = ("device", "sort_order", "is_active")
    list_filter   = ("device", "is_active", "parent")
    search_fields = ("name", "slug", "url")
    autocomplete_fields = ("parent", "category")
    prepopulated_fields = {"slug": ("name",)}
