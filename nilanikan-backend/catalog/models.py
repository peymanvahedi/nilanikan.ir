# catalog/models.py
from django.db import models


# =========================
# Category
# =========================
class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


# =========================
# Product
# =========================
class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    sku = models.CharField(max_length=64, unique=True)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)

    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=False)  # ⟵ تیک محصول پیشنهادی
    created_at = models.DateTimeField(auto_now_add=True)

    attributes = models.ManyToManyField(
    'AttributeValue', blank=True, related_name='products'
)
    size_chart = models.JSONField(blank=True, null=True)

    def __str__(self) -> str:
        return self.name


def product_image_upload_to(instance, filename: str) -> str:
    # در صورت نبودن slug، از id استفاده می‌کنیم
    slug_or_id = instance.product.slug if instance.product.slug else instance.product_id
    return f"products/gallery/{slug_or_id}/{filename}"


class ProductImage(models.Model):
    """گالری تصاویر برای هر محصول"""
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="gallery"
    )
    image = models.ImageField(upload_to=product_image_upload_to)
    alt = models.CharField(max_length=200, blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"Image for {self.product.name}"


# =========================
# Bundle
# =========================
def bundle_image_upload_to(instance, filename: str) -> str:
    slug_or_id = instance.bundle.slug if instance.bundle.slug else instance.bundle_id
    return f"bundles/{slug_or_id}/{filename}"


class Bundle(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    products = models.ManyToManyField(Product, related_name="bundles", blank=True)
    bundle_price = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    image = models.ImageField(upload_to="bundles/", blank=True, null=True)  # کاور
    active = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=False)  # ⟵ تیک باندل پیشنهادی
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class BundleImage(models.Model):
    """گالری تصاویر برای هر باندل"""
    bundle = models.ForeignKey(
        Bundle, on_delete=models.CASCADE, related_name="gallery"
    )
    image = models.ImageField(upload_to=bundle_image_upload_to)
    alt = models.CharField(max_length=255, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"Image for {self.bundle.title}"


# =========================
# Banner
# =========================
class Banner(models.Model):
    image = models.ImageField(upload_to="banners/")
    href = models.URLField(blank=True, null=True)
    alt = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0, help_text="عدد کمتر = جلوتر")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-id"]

    def __str__(self) -> str:
        return self.alt or f"Banner {self.id}"



class Attribute(models.Model):
    TEXT = "text"
    COLOR = "color"
    SELECT = "select"
    TYPE_CHOICES = (
        (TEXT, "Text"),
        (COLOR, "Color"),
        (SELECT, "Select"),
    )

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=SELECT)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE, related_name="values")
    value = models.CharField(max_length=100)
    slug = models.SlugField()
    color_code = models.CharField(max_length=12, blank=True, null=True)  # برای رنگ‌ها

    class Meta:
        unique_together = (("attribute", "slug"),)

    def __str__(self):
        return f"{self.attribute.name}: {self.value}"
