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

    # منو
    is_active = models.BooleanField(default=True)
    show_in_menu = models.BooleanField(default=True)
    menu_order = models.IntegerField(default=0)
    icon = models.CharField(max_length=64, blank=True, null=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    # راهنمای سایز پیش‌فرض برای دسته (اختیاری)
    default_size_guide_title = models.CharField(max_length=120, blank=True, null=True)
    default_size_guide_url   = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["menu_order", "name"]

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

    # قیمت محصول می‌تواند خالی باشد؛ قیمت روی واریانت‌ها
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )

    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)

    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # راهنمای سایز اختصاصی محصول (برای دکمه «راهنمای سایز»)
    size_guide_title = models.CharField(max_length=120, blank=True, null=True)
    size_guide_url   = models.URLField(blank=True, null=True)
    size_guide_html  = models.TextField(blank=True, null=True, db_column='product_size_guide_html')
    size_chart_image = models.ImageField(upload_to="products/size_charts/", blank=True, null=True)
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
    image_variants = models.JSONField(blank=True, null=True, default=dict)
    alt = models.CharField(max_length=200, blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"Image for {self.product.name}"


# ---------- Product Videos ----------
def product_video_upload_to(instance, filename: str) -> str:
    slug_or_id = instance.product.slug if instance.product.slug else instance.product_id
    return f"products/{slug_or_id}/videos/{filename}"


class ProductVideo(models.Model):
    """گالری ویدیو برای هر محصول"""
    product = models.ForeignKey("Product", on_delete=models.CASCADE, related_name="videos")
    file = models.FileField(upload_to=product_video_upload_to, blank=True, null=True)
    external_url = models.URLField(blank=True, null=True)
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
    image = models.ImageField(upload_to="bundles/", blank=True, null=True)
    active = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=False)
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
    color_code = models.CharField(max_length=12, blank=True, null=True)

    class Meta:
        unique_together = (("attribute", "slug"),)

    def __str__(self):
        return f"{self.attribute.name}: {self.value}"


# --- ProductVariant: قیمت جدا برای ترکیب رنگ/سایز ---
class ProductVariant(models.Model):
    product = models.ForeignKey("Product", on_delete=models.CASCADE, related_name="variants")

    size = models.ForeignKey(
        "AttributeValue", on_delete=models.PROTECT, related_name="size_variants",
        null=True, blank=True
    )
    color = models.ForeignKey(
        "AttributeValue", on_delete=models.PROTECT, related_name="color_variants",
        null=True, blank=True
    )

    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "size", "color"],
                name="uq_product_size_color"
            )
        ]

    def __str__(self):
        sval = getattr(self.size, "value", None)
        cval = getattr(self.color, "value", None)
        parts = [p for p in [cval, sval] if p]
        return f"{self.product.name} - {' / '.join(parts) or 'Variant'} ({self.price or 0})"


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
