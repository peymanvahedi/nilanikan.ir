"use client";

import FooterBranchesTabs from "@/components/FooterBranchesTabs";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      {/* سه ستون مساوی */}
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-3 text-sm text-zinc-700">

        {/* معرفی فروشگاه + پیگیری سفارش */}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold mb-4 text-pink-600">نیلانیکان</h2>
          <p className="leading-8 md:text-[15px] text-justify flex-1">
            فروشگاه اینترنتی نیلانیکان در قلب ایران فعالیت خودش را آغاز نموده است.
            ما بهترین لباس کودک را برای مردم شریف ایران فراهم کرده‌ایم و
            از سال ۱۳۸۷ با کیفیت بالا، قیمت رقابتی و خدمات عالی
            اعتماد صدها هزار مشتری در سراسر کشور را جلب کرده‌ایم.
          </p>

          {/* پیگیری سفارش */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">پیگیری سفارش</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = (e.currentTarget.elements.namedItem("orderCode") as HTMLInputElement).value;
                if (code.trim()) window.location.href = `/track-order/${code}`;
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                name="orderCode"
                placeholder="کد سفارش خود را وارد کنید"
                className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 text-sm"
              >
                پیگیری
              </button>
            </form>
          </div>
        </div>

        {/* لینک‌های مهم */}
        <div className="flex flex-col">
          <h3 className="font-semibold mb-4">لینک‌های مهم</h3>
          <ul className="space-y-3 leading-7 flex-1">
            <li><a href="/about" className="hover:text-pink-600">درباره ما</a></li>
            <li><a href="/contact" className="hover:text-pink-600">تماس با ما</a></li>
            <li><a href="/faq" className="hover:text-pink-600">سوالات متداول</a></li>
            <li><a href="/privacy" className="hover:text-pink-600">حریم خصوصی</a></li>
            <li><a href="/terms" className="hover:text-pink-600">شرایط استفاده</a></li>
          </ul>
        </div>

        {/* شعبات حضوری با تب‌ها */}
        <div className="flex flex-col">
          <div className="w-full">
            <h3 className="text-base md:text-lg font-bold text-zinc-800">شعبات حضوری</h3>
            <div className="mt-2 h-[3px] w-full rounded bg-pink-500/70" />
          </div>

          <div className="mt-4">
            <FooterBranchesTabs />
          </div>
        </div>
      </div>

      {/* نمادها */}
      <div className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7 flex flex-wrap justify-center gap-8">
          <a href="https://trustseal.enamad.ir/" target="_blank" rel="noopener noreferrer">
            <img src="/images/enamad.png" alt="اینماد" className="h-16 w-auto" />
          </a>
          <a href="https://torob.com/your-shop" target="_blank" rel="noopener noreferrer">
            <img src="/images/torob-logo.png" alt="ترب" className="h-16 w-auto" />
          </a>
          <a href="https://emalls.ir/your-shop" target="_blank" rel="noopener noreferrer">
            <img src="/images/emalls-logo.png" alt="ایمالز" className="h-16 w-auto" />
          </a>
          <a href="https://rezanamad.ir/your-shop" target="_blank" rel="noopener noreferrer">
            <img src="/images/rezanamad-logo.png" alt="نماد رضا" className="h-16 w-auto" />
          </a>
        </div>
      </div>

      <div className="border-t border-zinc-200 text-center text-xs text-zinc-500 py-4">
        © {new Date().getFullYear()} نیلانیکان — تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}
