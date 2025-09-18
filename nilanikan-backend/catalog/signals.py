# catalog/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ProductImage
from core.utils.images import generate_variants


@receiver(post_save, sender=ProductImage)
def build_productimage_variants(sender, instance: ProductImage, created, **kwargs):
    # اگر تصویری نیست، کاری نکن
    if not instance.image:
        return

    # ساخت نسخه‌های WebP و thumbnail
    variants = generate_variants(instance.image, widths=(200, 400, 800), make_avif=False)

    # ذخیره در فیلد JSON فقط اگر تغییری هست
    if variants and instance.image_variants != variants:
        # update بدون سیگنال مجدد
        ProductImage.objects.filter(pk=instance.pk).update(image_variants=variants)
