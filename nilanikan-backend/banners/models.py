# banners/models.py
from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class OrderedActiveModel(TimeStampedModel):
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ("order", "-created_at")

# ✅ اسلاید هدر
class Slide(OrderedActiveModel):
    title = models.CharField(max_length=255, blank=True)
    alt   = models.CharField(max_length=255, blank=True)
    link  = models.URLField(blank=True)  # اگر داخلیه و URLField نمی‌خوای، CharField بگذار
    image = models.ImageField(upload_to="slides/")

    def __str__(self):
        return self.title or f"Slide #{self.pk}"

# ✅ بنر ثابت
class Banner(OrderedActiveModel):
    title    = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    link     = models.URLField(blank=True)  # اگر لینک داخلی است، CharField هم می‌شود
    image    = models.ImageField(upload_to="banners/")

    def __str__(self):
        return self.title
