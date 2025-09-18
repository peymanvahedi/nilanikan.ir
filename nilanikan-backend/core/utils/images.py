# core/utils/images.py
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import os

# سایزهایی که می‌خواهیم تولید کنیم (عرض برحسب پیکسل)
DEFAULT_WIDTHS = (200, 400, 800)

def _stem(path): 
    return os.path.splitext(path)[0]

def _save_bytes(path, data: bytes, content_type="image/webp"):
    # اگر از S3/MinIO استفاده می‌کنید، default_storage خودش هندل می‌کند
    if default_storage.exists(path):
        default_storage.delete(path)
    default_storage.save(path, ContentFile(data))

def _to_webp_bytes(pil_img: Image.Image, quality=70) -> bytes:
    out = BytesIO()
    pil_img.save(out, format="WEBP", quality=quality, method=6)
    return out.getvalue()

def _resize_width(pil_img: Image.Image, width: int) -> Image.Image:
    if pil_img.width <= width:
        return pil_img
    h = int(pil_img.height * (width / pil_img.width))
    return pil_img.resize((width, h), Image.Resampling.LANCZOS)

def generate_variants(filefield, widths=DEFAULT_WIDTHS, make_avif=False):
    """
    هنگام ذخیره‌ی تصویر، این تابع را صدا بزنید تا:
      - نسخه‌ی WebP کامل
      - نسخه‌های کوچک‌شده‌ی WebP برای عرض‌های مشخص
      - (اختیاری) AVIF
    بسازد. خروجی: دیکشنری URLها برای استفاده در API/فرانت.
    """
    if not filefield:
        return {}

    # فایل اصلی را بخوان
    with default_storage.open(filefield.name, "rb") as f:
        img = Image.open(f)
        # اصلاح چرخش EXIF و تبدیل به RGB
        img = ImageOps.exif_transpose(img).convert("RGB")

    base = _stem(filefield.name)  # مثال: media/products/abc
    variants = {"webp": {}, "avif": {} if make_avif else None}

    # نسخه‌ی کامل WebP
    webp_full_path = f"{base}.webp"
    _save_bytes(webp_full_path, _to_webp_bytes(img, quality=70))
    variants["webp"]["full"] = default_storage.url(webp_full_path)

    # نسخه‌های کوچک‌شده
    for w in widths:
        resized = _resize_width(img, w)
        webp_bytes = _to_webp_bytes(resized, quality=70)
        webp_path = f"{base}.w{w}.webp"
        _save_bytes(webp_path, webp_bytes)
        variants["webp"][f"{w}w"] = default_storage.url(webp_path)

    # (اختیاری) AVIF
    if make_avif:
        try:
            from pillow_avif import AvifImagePlugin  # noqa: F401
            out = BytesIO()
            img.save(out, format="AVIF", quality=60)
            avif_full = f"{base}.avif"
            _save_bytes(avif_full, out.getvalue(), content_type="image/avif")
            variants["avif"]["full"] = default_storage.url(avif_full)

            for w in widths:
                resized = _resize_width(img, w)
                out = BytesIO()
                resized.save(out, format="AVIF", quality=60)
                avif_path = f"{base}.w{w}.avif"
                _save_bytes(avif_path, out.getvalue(), content_type="image/avif")
                variants["avif"][f"{w}w"] = default_storage.url(avif_path)
        except Exception:
            variants["avif"] = None  # اگر AVIF پشتیبانی نشد، نادیده بگیر

    return variants
