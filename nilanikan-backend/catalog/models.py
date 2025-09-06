from django.db import models


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

    def __str__(self):
        return self.name


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
    created_at = models.DateTimeField(auto_now_add=True)

    attributes = models.JSONField(default=dict, blank=True, null=True)
    size_chart = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name


# 👇 مدل جدید برای گالری محصول
class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="gallery"
    )
    image = models.ImageField(upload_to="products/gallery/")
    alt = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"Image for {self.product.name}"


class Bundle(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    products = models.ManyToManyField(Product, related_name="bundles", blank=True)
    bundle_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="bundles/", blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class BundleImage(models.Model):
    bundle = models.ForeignKey(
        Bundle, on_delete=models.CASCADE, related_name="gallery"
    )
    image = models.ImageField(upload_to="bundles/gallery/")

    def __str__(self):
        return f"Image for {self.bundle.title}"


class Banner(models.Model):
    image = models.ImageField(upload_to="banners/")
    href = models.URLField(blank=True, null=True)
    alt = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0, help_text="عدد کمتر = جلوتر")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-id"]

    def __str__(self):
        return self.alt or f"Banner {self.id}"

