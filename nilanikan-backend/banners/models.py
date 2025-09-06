from django.db import models

class Slide(models.Model):
    title = models.CharField(max_length=200, blank=True)
    alt   = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="slides/")

    # لینک دلخواه (اختیاری)
    link  = models.URLField(blank=True)

    # اتصال اختیاری به محصول (درصورت حذف محصول، اسلاید می‌ماند)
    product = models.ForeignKey(
        "catalog.Product", related_name="slides",
        on_delete=models.SET_NULL, null=True, blank=True
    )

    is_active = models.BooleanField(default=True)
    order     = models.PositiveIntegerField(default=0, help_text="عدد کمتر = جلوتر")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title or f"Slide #{self.pk}"
