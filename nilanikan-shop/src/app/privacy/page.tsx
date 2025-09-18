// src/app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "حریم خصوصی | نیلانیکان",
  description:
    "سیاست‌های حریم خصوصی فروشگاه نیلانیکان درباره گردآوری، استفاده و حفاظت از اطلاعات کاربران",
};

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pink-100 text-pink-600 text-xs font-extrabold">
        ●
      </span>
      <span className="text-zinc-700">{children}</span>
    </li>
  );
}

function Card({
  id,
  icon,
  title,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-7 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-600 text-white text-lg">
          {icon}
        </div>
        <h2 className="text-lg md:text-xl font-extrabold text-zinc-900">
          {title}
        </h2>
      </div>
      <div className="mt-3 text-[15px] leading-7">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      {/* Hero */}
      <div className="rounded-3xl border border-pink-200 bg-gradient-to-l from-pink-50 to-white p-8 md:p-12 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">
            حریم خصوصی نیلانیکان
          </h1>
          <span className="rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-bold text-pink-600">
            آخرین به‌روزرسانی: ۱۴۰۳
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-zinc-700 leading-8">
          در نیلانیکان به حریم خصوصی شما احترام می‌گذاریم. این صفحه توضیح می‌دهد
          چه داده‌هایی جمع‌آوری می‌کنیم، چطور از آن‌ها استفاده می‌کنیم و چگونه
          از آن‌ها محافظت می‌شود. استفادهٔ شما از وب‌سایت به معنی پذیرش این
          سیاست است.
        </p>

        {/* فهرست دسترسی سریع */}
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "#collect", label: "اطلاعات جمع‌آوری‌شده" },
            { href: "#use", label: "نحوه استفاده" },
            { href: "#cookies", label: "کوکی‌ها" },
            { href: "#share", label: "اشتراک‌گذاری" },
          ].map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="inline-flex items-center justify-between rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-bold text-pink-600 hover:bg-pink-50"
            >
              {i.label} <span>↗</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-8 grid gap-6">
        <Card id="collect" icon="🗂️" title="اطلاعاتی که جمع‌آوری می‌کنیم">
          <ul className="mt-2 grid gap-2">
            <Bullet>اطلاعات هویتی: نام، شماره تماس، ایمیل، آدرس.</Bullet>
            <Bullet>اطلاعات سفارش: محصولات، مبالغ، روش‌های پرداخت و ارسال.</Bullet>
            <Bullet>اطلاعات فنی: IP، نوع مرورگر، صفحات مشاهده‌شده، کوکی‌ها.</Bullet>
            <Bullet>تعاملات پشتیبانی: مکاتبات، گفت‌وگوهای آنلاین و تیکت‌ها.</Bullet>
          </ul>
        </Card>

        <Card id="use" icon="⚙️" title="نحوه استفاده از اطلاعات">
          <ul className="mt-2 grid gap-2">
            <Bullet>پردازش سفارش، ارسال و پشتیبانی پس از فروش.</Bullet>
            <Bullet>
              بهبود تجربهٔ کاربری، تحلیل عملکرد و شخصی‌سازی محتوا.
            </Bullet>
            <Bullet>
              اطلاع‌رسانی دربارهٔ وضعیت سفارش و پیشنهادهای ویژه (در صورت رضایت
              شما).
            </Bullet>
            <Bullet>انجام الزامات قانونی و پاسخ به مراجع ذی‌صلاح.</Bullet>
          </ul>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card id="cookies" icon="🍪" title="کوکی‌ها">
            برای ارائه خدمات بهتر از کوکی و فناوری‌های مشابه استفاده می‌کنیم.
            می‌توانید کوکی‌ها را در تنظیمات مرورگر مدیریت کنید؛ اما ممکن است
            برخی قابلیت‌های سایت محدود شود.
          </Card>

          <Card id="share" icon="🤝" title="اشتراک‌گذاری با اشخاص ثالث">
            اطلاعات شما فقط در صورت نیاز با ارائه‌دهندگان خدمات (حمل‌ونقل،
            پرداخت، ارتباطات) به‌صورت امن و در حد ضرورت به اشتراک گذاشته می‌شود.
            اطلاعات شما به فروش نمی‌رسد.
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card icon="🔐" title="نگهداری و امنیت داده">
            داده‌ها به مدت موردنیاز برای اهداف ذکرشده نگهداری می‌شوند و با
            روش‌های متعارف امنیتی محافظت خواهند شد. هیچ سامانه‌ای مصون از
            آسیب نیست؛ با این حال به‌طور مستمر استانداردهای امنیتی را به‌روز
            می‌کنیم.
          </Card>

          <Card icon="✅" title="حقوق شما">
            <ul className="mt-2 grid gap-2">
              <Bullet>درخواست دسترسی، اصلاح یا به‌روزرسانی اطلاعات شخصی.</Bullet>
              <Bullet>درخواست حذف اطلاعات طبق قوانین مربوطه.</Bullet>
              <Bullet>لغو دریافت پیام‌های تبلیغاتی در هر زمان.</Bullet>
            </ul>
          </Card>
        </div>

        <Card icon="👶" title="حریم خصوصی کودکان">
          خدمات ما برای خرید توسط والدین/سرپرستان در نظر گرفته شده است. اگر
          متوجه شویم اطلاعات کودکی بدون رضایت سرپرست ثبت شده، برای حذف آن
          اقدام می‌کنیم.
        </Card>

        <Card icon="📝" title="تغییرات این سیاست">
          ممکن است این سیاست دوره‌ای به‌روزرسانی شود. نسخهٔ جدید پس از انتشار
          در همین صفحه لازم‌الاجراست.
        </Card>

        <Card icon="📨" title="ارتباط با ما">
          برای اعمال حقوق خود یا پرسش‌های بیشتر، از طریق{" "}
          <Link href="/contact" className="text-pink-600 hover:underline font-bold">
            صفحه تماس با ما
          </Link>{" "}
          با پشتیبانی در ارتباط باشید.
        </Card>
      </div>
    </main>
  );
}
