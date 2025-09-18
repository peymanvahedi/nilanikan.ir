// src/app/faq/page.tsx
import Link from "next/link";

export const metadata = {
  title: "سوالات متداول | نیلانیکان",
  description: "پاسخ به پرسش‌های پرتکرار مشتریان نیلانیکان",
};

export default function FAQPage() {
  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">سوالات متداول</h1>
      <p className="mt-2 text-zinc-600">
        در این بخش به رایج‌ترین سوال‌ها پاسخ داده‌ایم. اگر جواب خود را پیدا نکردید،
        از طریق{" "}
        <Link href="/contact" className="text-pink-600 hover:underline font-bold">
          صفحه تماس با ما
        </Link>{" "}
        با پشتیبانی در ارتباط باشید.
      </p>

      <section className="mt-8 grid gap-3">
        <Item
          q="زمان ارسال سفارش‌ها چقدر است؟"
          a="سفارش‌ها در روزهای کاری ظرف ۱ تا ۳ روز کاری پردازش و به پست تحویل می‌شوند. زمان دقیق تحویل بسته به شهر مقصد متغیر است."
        />
        <Item
          q="هزینه ارسال چگونه محاسبه می‌شود؟"
          a="هزینه ارسال هنگام نهایی‌سازی خرید بر اساس آدرس شما محاسبه و نمایش داده می‌شود. در کمپین‌ها ممکن است ارسال رایگان یا تخفیف‌دار داشته باشیم."
        />
        <Item
          q="امکان تعویض سایز وجود دارد؟"
          a="بله. در صورت سلامت کالا و حفظ پلمب/اتیکت، می‌توانید تا ۴۸ ساعت پس از تحویل برای تعویض سایز اقدام کنید. لطفاً قبل از ارسال با پشتیبانی هماهنگ کنید."
        />
        <Item
          q="شرایط مرجوعی چیست؟"
          a="به‌دلیل بهداشتی بودن پوشاک، مرجوعی فقط در صورت ایراد فنی/ارسال اشتباه و پس از تایید تیم کنترل کیفیت پذیرفته می‌شود."
        />
        <Item
          q="چطور سفارش خود را پیگیری کنم؟"
          a="پس از ثبت سفارش، کد رهگیری در پنل کاربری و پیامک برایتان ارسال می‌شود. همچنین می‌توانید از بخش «پیگیری سفارش» در فوتر سایت با وارد کردن کد، وضعیت را مشاهده کنید."
        />
        <Item
          q="روش‌های پرداخت چیست؟"
          a="پرداخت آنلاین از طریق درگاه‌های امن بانکی انجام می‌شود. در حال حاضر پرداخت در محل فعال نیست."
        />
        <Item
          q="آیا عکس‌های محصولات تن‌خور واقعی دارند؟"
          a="بله. علاوه بر عکس استودیویی، بخشی از محصولات دارای عکس تن‌خور مشتریان هستند تا انتخاب سایز دقیق‌تری داشته باشید."
        />
        <Item
          q="راهنمای سایزبندی را از کجا ببینم؟"
          a="صفحه هر محصول جدول راهنمای سایز دارد. لطفاً اندازه‌های کودک را با جدول مقایسه کنید تا انتخاب مطمئن‌تری داشته باشید."
        />
        <Item
          q="ساعات پاسخ‌گویی پشتیبانی؟"
          a="از شنبه تا پنجشنبه، ساعت ۹ تا ۱۷ پاسخ‌گو هستیم."
        />
        <Item
          q="چطور با پشتیبانی تماس بگیرم؟"
          a={
            <>
              می‌توانید با شماره‌های{" "}
              <a href="tel:01333336429" className="font-bold hover:text-pink-600">
                013-33336429
              </a>{" "}
              و{" "}
              <a href="tel:09009841510" className="font-bold hover:text-pink-600">
                09009841510
              </a>{" "}
              تماس بگیرید یا به{" "}
              <a href="mailto:info@nilanikan.com" className="font-bold text-pink-600 hover:underline">
                info@nilanikan.com
              </a>{" "}
              ایمیل بزنید. همچنین از طریق{" "}
              <Link href="/contact" className="text-pink-600 hover:underline font-bold">
                صفحه تماس با ما
              </Link>{" "}
              می‌توانید گفت‌وگوی آنلاین را شروع کنید.
            </>
          }
        />
      </section>
    </main>
  );
}

function Item({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="font-extrabold text-zinc-900">{q}</span>
        <span
          className="grid h-7 w-7 place-items-center rounded-full border border-pink-200 text-pink-600
                     transition group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="mt-3 text-[15px] leading-7 text-zinc-700">{a}</div>
    </details>
  );
}
