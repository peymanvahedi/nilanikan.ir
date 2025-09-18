// src/app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "شرایط استفاده | نیلانیکان",
  description:
    "قوانین و شرایط استفاده از وب‌سایت و خدمات فروشگاه نیلانیکان",
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
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-7 shadow-sm">
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

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      {/* Hero */}
      <div className="rounded-3xl border border-pink-200 bg-gradient-to-l from-pink-50 to-white p-8 md:p-12 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">
          شرایط و قوانین استفاده از نیلانیکان
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-700 leading-8">
          استفاده از وب‌سایت و خدمات نیلانیکان به منزلهٔ پذیرش این شرایط است.
          لطفاً قبل از ثبت سفارش، این صفحه را با دقت مطالعه کنید. در صورت وجود
          سوال، از{" "}
          <Link href="/contact" className="text-pink-600 hover:underline font-bold">
            صفحهٔ تماس با ما
          </Link>{" "}
          با پشتیبانی در ارتباط باشید.
        </p>
      </div>

      {/* Sections */}
      <div className="mt-8 grid gap-6">
        <Card title="قبول شرایط" icon="✅">
          با ورود به سایت، ایجاد حساب یا ثبت سفارش، شما تأیید می‌کنید که
          قوانین حاضر و تمامی به‌روزرسانی‌های بعدی آن را پذیرفته‌اید.
        </Card>

        <Card title="حساب کاربری و اطلاعات هویتی" icon="👤">
          <ul className="grid gap-2 mt-2">
            <Bullet>مسئولیت صحت اطلاعات ثبت‌شده (نام، آدرس، شماره تماس و …) با کاربر است.</Bullet>
            <Bullet>حفظ محرمانگی اطلاعات ورود (نام کاربری/رمز) بر عهدهٔ کاربر است.</Bullet>
            <Bullet>در صورت مشاهدهٔ فعالیت مشکوک، امکان مسدودسازی موقت حساب وجود دارد.</Bullet>
          </ul>
        </Card>

        <Card title="ثبت سفارش و پرداخت" icon="🛒">
          <ul className="grid gap-2 mt-2">
            <Bullet>سفارش پس از پرداخت موفق و تأیید نهایی سیستم ثبت می‌شود.</Bullet>
            <Bullet>در صورت بروز مغایرت موجودی/قیمت، مبلغ پرداختی به کاربر عودت داده خواهد شد.</Bullet>
            <Bullet>رسید پرداخت آنلاین به معنی تکمیل قطعی سفارش نیست و نیازمند بررسی نهایی است.</Bullet>
          </ul>
        </Card>

        <Card title="ارسال و تحویل" icon="🚚">
          <ul className="grid gap-2 mt-2">
            <Bullet>زمان آماده‌سازی و ارسال بر اساس مقصد و شرایط لجستیک متغیر است.</Bullet>
            <Bullet>پس از تحویل به شرکت حمل‌ونقل، رهگیری مرسوله از طریق کد پیگیری امکان‌پذیر است.</Bullet>
            <Bullet>لطفاً هنگام تحویل، سلامت ظاهری بسته را بررسی و در صورت ایراد، صورتجلسه کنید.</Bullet>
          </ul>
        </Card>

        <Card title="تعویض سایز و مرجوعی" icon="🔄">
          <ul className="grid gap-2 mt-2">
            <Bullet>به‌دلیل ماهیت بهداشتی پوشاک، مرجوعی تنها در صورت ایراد فنی/ارسال اشتباه و پس از تأیید QC انجام می‌شود.</Bullet>
            <Bullet>تعویض سایز طبق قوانین فروشگاه و در بازهٔ تعیین‌شده امکان‌پذیر است (عدم استفاده، حفظ پلمب/اتیکت، فاکتور).</Bullet>
            <Bullet>هزینه‌های ارسال تعویض/مرجوعی بر اساس مورد و قانون جاری محاسبه می‌شود.</Bullet>
          </ul>
        </Card>

        <Card title="قیمت‌گذاری و موجودی" icon="💳">
          <ul className="grid gap-2 mt-2">
            <Bullet>قیمت‌ها ممکن است بدون اطلاع قبلی به‌روزرسانی شوند.</Bullet>
            <Bullet>در موارد نادر مغایرت قیمت/موجودی، سفارش قابل لغو و وجه مسترد خواهد شد.</Bullet>
          </ul>
        </Card>

        <Card title="مالکیت فکری" icon="©️">
          کلیهٔ محتوا، تصاویر، لوگو و طرح‌های ارائه‌شده در نیلانیکان متعلق به
          فروشگاه است. هرگونه استفادهٔ تجاری بدون اخذ مجوز کتبی ممنوع است.
        </Card>

        <Card title="رفتار کاربر" icon="⚠️">
          <ul className="grid gap-2 mt-2">
            <Bullet>ارسال محتوای مخرب، توهین‌آمیز، ناقض حقوق دیگران یا مغایر قوانین کشور ممنوع است.</Bullet>
            <Bullet>هرگونه تلاش برای اختلال در سرویس، نفوذ یا دورزدن محدودیت‌ها پیگرد قانونی دارد.</Bullet>
          </ul>
        </Card>

        <Card title="محدودیت مسئولیت" icon="🛡️">
          نیلانیکان نهایت تلاش خود را برای ارائهٔ سرویس پایدار و دقیق می‌کند،
          با این حال مسئولیت خسارات غیرمستقیم ناشی از استفاده یا عدم امکان
          استفاده از خدمات، بر عهدهٔ کاربر خواهد بود.
        </Card>

        <Card title="فورس ماژور" icon="🌩️">
          در شرایط خارج از کنترل (مانند بلایای طبیعی، قطعی گسترده زیرساخت، مقررات
          اضطراری و …) تعهدات ممکن است با تأخیر یا تعلیق مواجه شود.
        </Card>

        <Card title="تغییرات قوانین" icon="📝">
          شرایط استفاده ممکن است به‌روز شوند. نسخهٔ جدید پس از انتشار در همین
          صفحه لازم‌الاجراست. توصیه می‌کنیم دوره‌ای این صفحه را مرور کنید.
        </Card>

        <Card title="قانون حاکم و حل اختلاف" icon="⚖️">
          این شرایط تابع قوانین جمهوری اسلامی ایران است. در صورت بروز اختلاف،
          ابتدا موضوع از طریق پشتیبانی بررسی می‌شود و در صورت نیاز، مراجع ذی‌صلاح
          تصمیم‌گیر خواهند بود.
        </Card>

        <Card title="ارتباط با ما" icon="📨">
          برای پرسش‌های حقوقی یا درخواست توضیحات بیشتر، از{" "}
          <Link href="/contact" className="text-pink-600 hover:underline font-bold">
            صفحهٔ تماس با ما
          </Link>{" "}
          استفاده کنید.
        </Card>
      </div>
    </main>
  );
}
