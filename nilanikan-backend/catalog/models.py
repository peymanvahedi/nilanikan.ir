from django.db import models
from django.utils.text import slugify


# =========================
# Category (only once)
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

    # فیلدهای مخصوص منو
    is_active = models.BooleanField(default=True)
    show_in_menu = models.BooleanField(default=True)
    menu_order = models.IntegerField(default=0)  # ترتیب نمایش در منو
    icon = models.CharField(max_length=64, blank=True, null=True)  # نام آیکون/کلاس دلخواه
    image = models.ImageField(upload_to="categories/", blank=True, null=True)  # بنر/تصویر منو

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["menu_order", "name"]  # ابتدا بر اساس ترتیب منو، سپس نام

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
        "AttributeValue", blank=True, related_name="products"
    )
    size_chart = models.JSONField(blank=True, null=True)

    def __str__(self) -> str:
        return self.name


def product_image_upload_to(instance, filename: str) -> str:
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

class ProductImage(models.Model):
    """گالری تصاویر برای هر محصول"""
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="gallery"
    )
    image = models.ImageField(upload_to=product_image_upload_to)

    # ✅ جدید: نگهداری لینک نسخه‌های WebP و thumbnail
    image_variants = models.JSONField(blank=True, null=True, default=dict)

    alt = models.CharField(max_length=200, blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)


# ---------- Product Videos ----------
def product_video_upload_to(instance, filename: str) -> str:
    slug_or_id = instance.product.slug if instance.product.slug else instance.product_id
    return f"products/{slug_or_id}/videos/{filename}"


class ProductVideo(models.Model):
    """گالری ویدیو برای هر محصول"""
    product = models.ForeignKey("Product", on_delete=models.CASCADE, related_name="videos")
    # یکی از این دو: یا فایل آپلودی، یا لینک خارجی (آپارات/یوتیوب/ویمیو)
    file = models.FileField(upload_to=product_video_upload_to, blank=True, null=True)
    external_url = models.URLField(blank=True, null=True)
    # اختیاری: کاور
    thumbnail = models.ImageField(upload_to=product_video_upload_to, blank=True, null=True)
    title = models.CharField(max_length=200, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Video for {self.product.name}"


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


# ---------- Bundle Videos ----------
def bundle_video_upload_to(instance, filename: str) -> str:
    slug_or_id = instance.bundle.slug if instance.bundle.slug else instance.bundle_id
    return f"bundles/{slug_or_id}/videos/{filename}"


class BundleVideo(models.Model):
    """گالری ویدیو برای هر باندل"""
    bundle = models.ForeignKey("Bundle", on_delete=models.CASCADE, related_name="videos")
    file = models.FileField(upload_to=bundle_video_upload_to, blank=True, null=True)
    external_url = models.URLField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to=bundle_video_upload_to, blank=True, null=True)
    title = models.CharField(max_length=200, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Video for {self.bundle.title}"


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


# =========================
# Attributes
# =========================
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


# --- ProductVariant: قیمت جدا برای هر سایز ---
class ProductVariant(models.Model):
    product = models.ForeignKey("Product", on_delete=models.CASCADE, related_name="variants")
    size = models.ForeignKey("AttributeValue", on_delete=models.PROTECT, related_name="product_variants")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["product", "size"], name="uq_product_size")
        ]

    def __str__(self):
        sval = getattr(self.size, "value", "")
        return f"{self.product.name} - {sval} ({self.price})"



# =========================
# MenuItem (منوی مستقل با تفکیک دسکتاپ/موبایل)
# =========================
class MenuItem(models.Model):
    DEVICE_ALL = "all"
    DEVICE_DESKTOP = "desktop"
    DEVICE_MOBILE = "mobile"
    DEVICE_CHOICES = [
        (DEVICE_ALL, "All"),
        (DEVICE_DESKTOP, "Desktop"),
        (DEVICE_MOBILE, "Mobile"),
    ]

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, blank=True)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")

    # یکی از این دو برای لینک: اگر category باشد از /category/<slug> استفاده می‌شود؛ وگرنه url
    category = models.ForeignKey("Category", null=True, blank=True, on_delete=models.SET_NULL, related_name="menu_items")
    url = models.URLField(blank=True, null=True)

    icon = models.ImageField(upload_to="menu/icons/", blank=True, null=True)
    image = models.ImageField(upload_to="menu/images/", blank=True, null=True)

    sort_order = models.PositiveIntegerField(default=0)
    device = models.CharField(max_length=10, choices=DEVICE_CHOICES, default=DEVICE_ALL)
    is_active = models.BooleanField(default=True)
    open_in_new = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "id"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name
