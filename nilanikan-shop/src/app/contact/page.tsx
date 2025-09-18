import ContactChatCTA from "@/components/ContactChatCTA";
import Link from "next/link";

export const metadata = {
  title: "تماس با ما | نیلانیکان",
  description: "راه‌های ارتباط با فروشگاه نیلانیکان",
};

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">تماس با ما</h1>

      {/* کارت دعوت به گفتگوی آنلاین */}
      <ContactChatCTA />

      {/* باکس‌های اطلاعات سریع */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="https://instagram.com/nila_nikan_kids"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-pink-300"
        >
          <div className="text-sm text-zinc-500 mb-1">اینستاگرام</div>
          <div className="font-bold">@nila_nikan_kids</div>
        </a>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-500 mb-1">آدرس</div>
          <div className="font-bold">گیلان، رشت</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-500 mb-1">کد پستی</div>
          <div className="font-bold">۴۱۳۳۶۹۲۸۳۹</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-500 mb-1">شماره تماس</div>
          <div className="font-bold space-y-1">
            <Link href="tel:01333336429" className="block hover:text-pink-600">
              013-33336429
            </Link>
            <Link href="tel:09009841510" className="block hover:text-pink-600">
              09009841510
            </Link>
          </div>
        </div>
      </section>

      {/* دو ستون اصلی: ساعات پاسخ‌گویی + شعب */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {/* ساعات و تلفن‌ها */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-zinc-900 mb-2">
            ساعت پاسخ‌گویی ۹ صبح الی ۱۷
          </h3>
          <div className="h-[2px] w-full bg-pink-200/70 mb-4" />
          <div className="text-center space-y-2">
            <a href="tel:01333336429" className="block text-2xl font-black text-indigo-700">
              013-33336429
            </a>
            <a href="tel:09009841510" className="block text-2xl font-black text-indigo-700">
              09009841510
            </a>
          </div>
        </div>

        {/* اطلاعات تماس با نیلا نیکان (شعب) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-pink-700 mb-2">
            اطلاعات تماس با نیلا نیکان
          </h3>
          <div className="h-[2px] w-full bg-pink-200/70 mb-4" />
          <ul className="space-y-3 text-[15px] leading-7 text-zinc-800">
            <li>
              <span className="font-bold text-zinc-900">شعبه گلسار:</span>{" "}
              رشت، گلسار، بلوار دادمان، جنب کوچه آذر (روبروی مرکز خرید دیلمان)
            </li>
            <li>
              <span className="font-bold text-zinc-900">شعبه مطهری:</span>{" "}
              رشت، خیابان مطهری، روبروی مسجد&nbsp;…
            </li>
            <li>
              <span className="font-bold text-zinc-900">شعبه مسکن:</span>{" "}
              رشت، مسکن&nbsp;…{/* در صورت نیاز تکمیل کنید */}
            </li>
          </ul>
        </div>
      </section>

      {/* سایر راه‌های ارتباط */}
      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-extrabold mb-3 text-zinc-900">راه‌های دیگر ارتباط</h3>
        <ul className="space-y-2 text-[15px] leading-7">
          <li>
            ✉️ ایمیل:{" "}
            <a href="mailto:info@nilanikan.com" className="text-pink-600 hover:underline">
              info@nilanikan.com
            </a>
          </li>
          <li>
            ☎️ واتساپ پشتیبانی:{" "}
            <a href="https://wa.me/989009841510" className="text-pink-600 hover:underline">
              09009841510
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
