// src/app/about/page.tsx
import Link from "next/link";

export const metadata = {
  title: "درباره ما | نیلانیکان",
  description: "آشنایی با فروشگاه نیلانیکان و ارزش‌هایی که دنبال می‌کنیم",
};

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-l from-pink-50 to-white border border-pink-100 p-8 md:p-12 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">درباره نیلانیکان</h1>
        <p className="mt-3 text-zinc-700 leading-8 md:max-w-3xl">
          نیلانیکان با هدف ارائه‌ی پوشاک باکیفیت کودک و نوجوان و تجربه‌ی خریدی آسان و لذت‌بخش شکل گرفت.
          از سال ۱۳۸۷ تلاش کرده‌ایم با فراهم‌کردن تنوع به‌روز، قیمت منصفانه و پشتیبانی محترمانه،
          خیال خانواده‌ها را از خرید آنلاین راحت کنیم.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-pink-600 px-4 text-white text-sm font-bold hover:bg-pink-700"
          >
            شروع خرید
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center rounded-lg border border-pink-200 bg-white px-4 text-sm font-bold text-pink-600 hover:bg-pink-50"
          >
            تماس با ما
          </Link>
        </div>
      </section>

      {/* Story + Highlights */}
      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-extrabold text-zinc-900">داستان ما</h2>
          <p className="mt-3 text-zinc-700 leading-8">
            از یک تیم کوچک و عاشق دنیای کودک شروع کردیم؛
            امروز با اتکا به شبکه‌ی تامین مطمئن و تیم پشتیبانی پاسخگو،
            روزانه سفارش‌های زیادی را در سراسر کشور ارسال می‌کنیم.
            برای ما، راحتی فرزند شما و آرامش خیال والدین، اولویت اول است.
          </p>
          <p className="mt-3 text-zinc-700 leading-8">
            در نیلانیکان، «کیفیت واقعی»، «قیمت‌گذاری منصفانه» و «خدمات پس از فروش» شعار نیست؛
            تعهد روزانه‌ی ماست.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-zinc-900">آنچه برایش ارزش قائلیم</h3>
          <ul className="mt-4 space-y-3 text-zinc-700">
            <li>• کیفیت پارچه و دوخت مناسب پوست حساس کودک</li>
            <li>• تنوع سایزبندی و راهنمای اندازه دقیق</li>
            <li>• عکس‌ها و تن‌خور واقعی از مشتریان</li>
            <li>• ارسال سریع و بسته‌بندی امن</li>
            <li>• پاسخ‌گویی محترمانه و پیگیری سفارش</li>
            <li>• امکان تعویض سایز طبق قوانین فروشگاه</li>
          </ul>
        </div>
      </section>

      {/* Why Us */}
      <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-extrabold text-zinc-900">چرا نیلانیکان؟</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature title="کیفیت مطمئن" desc="انتخاب‌شده از تامین‌کنندگان معتبر و کنترل کیفیت مرحله‌ای." />
          <Feature title="قیمت منصفانه" desc="حذف هزینه‌های اضافی و ارائه پیشنهادهای دوره‌ای." />
          <Feature title="ارسال سریع" desc="تحویل سریع با امکان رهگیری سفارش تا درب منزل." />
          <Feature title="پشتیبانی پاسخگو" desc="پاسخ‌گویی ۹ تا ۱۷ از شنبه تا پنجشنبه." />
          <Feature title="تعویض سایز" desc="طبق قوانین فروشگاه در بازه تعیین‌شده." />
          <Feature title="تن‌خور واقعی" desc="نمایش تن‌خور مشتریان برای انتخاب دقیق‌تر." />
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 rounded-2xl border border-pink-200 bg-gradient-to-l from-pink-50 to-white p-6 md:p-8 text-center">
        <h3 className="text-lg md:text-xl font-extrabold text-zinc-900">همین حالا خرید را شروع کنید</h3>
        <p className="mt-2 text-zinc-700">بهترین‌های فصل برای کوچولوها آماده است.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/collection/set"
            className="inline-flex h-10 items-center rounded-lg bg-pink-600 px-4 text-white text-sm font-bold hover:bg-pink-700"
          >
            مشاهده ست‌ها
          </Link>
          <Link
            href="/new"
            className="inline-flex h-10 items-center rounded-lg border border-pink-200 bg-white px-4 text-sm font-bold text-pink-600 hover:bg-pink-50"
          >
            جدیدترین‌ها
          </Link>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-pink-600 text-xl">★</div>
      <div className="mt-1 font-extrabold text-zinc-900">{title}</div>
      <div className="mt-1 text-sm text-zinc-600 leading-6">{desc}</div>
    </div>
  );
}
