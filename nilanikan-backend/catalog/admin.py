from django.contrib import admin
from .models import Category, Product, ProductImage, Bundle, BundleImage, Banner


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "parent", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class ProductImageInline(admin.TabularInline):  # 👈 اینلاین برای گالری محصول
    model = ProductImage
    extra = 1   # چند فرم خالی برای آپلود عکس جدید
    fields = ("image", "alt")   # فقط این فیلدها نمایش داده بشن


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "sku", "category", "price", "stock", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("name", "sku", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]  # 👈 اینجا اضافه شد


@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "slug", "bundle_price", "active", "created_at")
    list_filter = ("active",)
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(BundleImage)
class BundleImageAdmin(admin.ModelAdmin):
    list_display = ("id", "bundle")


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "alt", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    search_fields = ("alt",)
    list_filter = ("is_active",)
