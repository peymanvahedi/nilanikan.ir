"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = { id: number; src: string; name: string; product: string };

// عناوین نمونه (به ترتیب 1..20) — می‌تونی از API واقعی خودت تزریق کنی
const productTitles: string[] = [
  "هودی چرم قهوه‌ای", "ست اسپرت خردلی", "ست ورزشی آبی", "کت چرم مشکی",
  "ست پاییزی آجری", "سوییشرت کلاهدار", "بلوز کتان کرم", "ست راحتی موکا",
  "پلیور بافت قهوه‌ای", "شلوار لی تیره", "کاپشن سبک بارانی", "ست ورزشی قرمز",
  "تی‌شرت آستین‌کوتاه", "هودی تدی کرم", "پلیور راه‌راه", "کاپشن بادی خردلی",
  "کت جین آبی", "ست خانگی نخی", "ژاکت زیپی مشکی", "ست سوییشرت نارنجی",
];

// 20 عکس تنخور را در public/stories بگذار
const items: Item[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  src: `/stories/story-${i + 1}.jpg`,
  name: `مشتری ${i + 1}`,
  product: productTitles[i] ?? `محصول ${i + 1}`,
}));

export default function CustomerCarousel() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(null), []);

  // آیتم امن برای مودال
  const current =
    openIndex !== null && openIndex >= 0 && openIndex < items.length
      ? items[openIndex]
      : null;

  // اسکرول کاروسل
  const scrollByStep = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * (window.innerWidth < 768 ? 0.9 : 0.8));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  const next = () => scrollByStep(1);
  const prev = () => scrollByStep(-1);

  // تبدیل اسکرول عمودی ماوس به افقی داخل کاروسل
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollBy({ left: e.deltaY, behavior: "smooth" });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // کیبورد: چپ/راست برای اسکرول یا ناوبری مودال، Esc برای بستن
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openIndex !== null) {
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") setOpenIndex((i) => (i! + 1) % items.length);
        if (e.key === "ArrowLeft") setOpenIndex((i) => (i! - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, close]);

  const goNextModal = () => setOpenIndex((i) => (i! + 1) % items.length);
  const goPrevModal = () => setOpenIndex((i) => (i! - 1 + items.length) % items.length);

  return (
    <section className="w-full" aria-label="گالری مشتریان (کاروسل)">
      {/* هدر + کنترل‌ها */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800">استایل مشتریان</h2>
        <div className="flex gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-[#F4E3D6] shadow hover:bg-[#EED8C7] grid place-items-center text-slate-700"
            aria-label="اسکرول به چپ"
            title="قبلی"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-[#F4E3D6] shadow hover:bg-[#EED8C7] grid place-items-center text-slate-700"
            aria-label="اسکرول به راست"
            title="بعدی"
          >
            ›
          </button>
        </div>
      </div>

      {/* ریل کاروسل */}
      <div className="relative">
        <div
          ref={railRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 pb-1 
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => open(i)}
              className="group shrink-0 w-[56%] sm:w-[32%] md:w-[24%] lg:w-[23%] xl:w-[18%] 
                         snap-start rounded-xl bg-[#F4E3D6] shadow hover:shadow-lg transition overflow-hidden 
                         outline-none focus:ring-2 focus:ring-pink-500"
              title={`${it.product} - ${it.name}`}
              aria-label={`مشاهده ${it.product}`}
            >
              {/* کارت با نسبت 3:4 */}
              <div className="relative w-full aspect-[3/4]">
                <Image
                  src={it.src}
                  alt={it.product}
                  fill
                  sizes="(max-width:640px) 56vw, (max-width:1024px) 32vw, (max-width:1280px) 24vw, 18vw"
                  className="object-cover"
                  priority={it.id <= 4}
                  draggable={false}
                />
              </div>

              {/* نوار پایین: عنوان محصول + نام مشتری (بدون رنگ سفید) */}
              <div className="px-3 py-2 text-right bg-[#EED8C7]">
                <p className="text-[13px] font-semibold text-slate-800 line-clamp-1">
                  {it.product}
                </p>
                <p className="text-[12px] text-slate-600 line-clamp-1">
                  {it.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* مودال پاپ‌آپ (نمایش بزرگ) */}
      {current && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="relative w-full max-w-[92vw] md:max-w-3xl lg:max-w-4xl aspect-[3/4] md:aspect-[16/10] 
                       bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.src}
              alt={current.product}
              fill
              sizes="(max-width: 768px) 90vw, 70vw"
              className="object-contain"
              priority
            />

            {/* هدر مودال: عنوان محصول */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between bg-black/40 text-white p-2 md:p-3">
              <span className="text-xs md:text-sm font-medium">{current.product}</span>
              <button
                onClick={close}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white w-8 h-8 grid place-items-center"
                aria-label="بستن"
                title="بستن"
              >
                ×
              </button>
            </div>

            {/* ناوبری مودال */}
            <button
              onClick={goPrevModal}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full 
                         bg-white/20 hover:bg-white/30 text-white text-xl grid place-items-center"
              aria-label="قبلی"
              title="قبلی"
            >
              ‹
            </button>
            <button
              onClick={goNextModal}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full 
                         bg-white/20 hover:bg-white/30 text-white text-xl grid place-items-center"
              aria-label="بعدی"
              title="بعدی"
            >
              ›
            </button>

            <div className="absolute bottom-0 left-0 right-0 bg-black/35 text-white text-xs md:text-sm p-2 text-center">
              برای بستن بیرون تصویر کلیک کنید یا Esc بزنید
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
