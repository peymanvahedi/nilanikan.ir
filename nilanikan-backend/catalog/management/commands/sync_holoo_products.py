from django.core.management.base import BaseCommand
from django.db import transaction
from catalog.models import Product
from holoo_client import holoo_request

PER_PAGE = 100  # تعداد آیتم هر صفحه

def fetch_products_page(page: int):
    """
    از وب‌سرویس هلو صفحه به صفحه می‌خوانیم:
    GET /Product/{page}/{per_page}
    """
    path = f"/Product/{page}/{PER_PAGE}"
    res = holoo_request("GET", path)
    if not res:
        return []
    return res.get("product") or res.get("products") or res  # بسته به خروجی

class Command(BaseCommand):
    help = "همگام‌سازی محصولات از نرم‌افزار هلو به دیتابیس سایت (با صفحه‌بندی)"

    def add_arguments(self, parser):
        parser.add_argument("--pages", type=int, default=0, help="فقط این تعداد صفحه را بخوان (۰ یعنی تا آخر)")

    @transaction.atomic
    def handle(self, *args, **opts):
        self.stdout.write("دریافت لیست محصولات از هلو ...")

        page = 1
        count_new, count_update, total = 0, 0, 0
        max_pages = opts.get("pages", 0)

        while True:
            items = fetch_products_page(page)
            if not items:
                break

            for item in items:
                # --- نگاشت مینیمال؛ در صورت نیاز مطابق فیلدهای واقعی خروجی هلو اصلاح کن ---
                code  = item.get("ErpCode") or item.get("ProductErpCode") or item.get("Code")
                name  = item.get("Name") or ""
                # قیمت‌ها در هلو ممکنه sellprice یا SellPrice باشه
                price = (
                    item.get("SellPrice")
                    or item.get("sellprice")
                    or item.get("Price")
                    or 0
                )

                if not code:
                    continue  # بدون کد، رد می‌کنیم

                obj, created = Product.objects.update_or_create(
                    external_code=code,
                    defaults={
                        "name": name,
                        "price": float(price or 0),
                        # اینجا هر فیلد دیگری از محصول سایتت را می‌توانی مقداردهی کنی
                    },
                )
                total += 1
                if created:
                    count_new += 1
                else:
                    count_update += 1

            self.stdout.write(f"صفحه {page} پردازش شد ({len(items)} کالا).")
            page += 1
            if max_pages and page > max_pages:
                break

        if total == 0:
            self.stdout.write(self.style.WARNING("هیچ داده‌ای دریافت نشد (شاید هلو وصل نیست)."))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"تمام شد: {total} کالا | جدید: {count_new} | به‌روزرسانی: {count_update}"
            ))
