"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

type Item = {
  id: string | number;
  name: string;
  image: string;
  price: number | string;
  oldPrice?: number | string;
  href?: string;
  discountPercent?: number;
};

function toFa(n: number) {
  try { return n.toLocaleString("fa-IR"); } catch { return n.toString(); }
}
function toNum(v?: number | string) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const fa = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
  const en = "01234567890123456789";
  const norm = v.replace(/[۰-۹٠-٩]/g, (d) => en[fa.indexOf(d)]).replace(/[^0-9.]/g, "");
  const n = Number(norm);
  return isNaN(n) ? 0 : n;
}
function calcPercent(price: number, oldPrice?: number, given?: number) {
  if (given && given > 0) return given;
  if (oldPrice && oldPrice > price) return Math.round(((oldPrice - price) / oldPrice) * 100);
  return 0;
}

export default function ProductSliderPro({
  title = "پیشنهاد ویژه",
  items = [],
  seeAllHref = "/products",
  endsAt, // ISO datetime اختیاری برای نمایش تایمر
}: {
  title?: string;
  items: Item[];
  seeAllHref?: string;
  endsAt?: string;
}) {
  // تایمر اختیاری (نمای سمت راست)
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const remain = useMemo(() => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - now;
    if (diff <= 0) return { h: "00", m: "00", s: "00", done: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return { h: pad(h), m: pad(m), s: pad(s), done: false };
  }, [now, endsAt]);

  return (
    <section dir="rtl" className="w-full">
      <div className="rounded-2xl border border-rose-200 bg-white overflow-hidden">
        {/* هدر */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between bg-rose-50/60 border-b border-rose-100">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">{title}</h2>
          <Link href={seeAllHref} className="text-rose-600 text-sm font-semibold hover:underline">
            مشاهده همه
          </Link>
        </div>

        <div className="flex">
          {/* پانل راست (اختیاری تایمر/برندینگ) */}
          {remain && !remain.done && (
            <aside className="hidden lg:flex w-60 min-w-60 flex-col items-center justify-center gap-4 bg-rose-600 text-white">
              <div className="text-2xl font-extrabold">پیشنهاد شگفت‌انگیز</div>
              <div className="flex items-center gap-2">
                <TimeBox label="ساعت" value={remain.h} />
                <TimeBox label="دقیقه" value={remain.m} />
                <TimeBox label="ثانیه" value={remain.s} />
              </div>
              <Link
                href={seeAllHref}
                className="mt-2 rounded-full bg-white text-rose-600 px-4 py-1.5 text-sm font-bold"
              >
                مشاهده همه
              </Link>
            </aside>
          )}

          {/* اسلایدر */}
          <div className="flex-1 relative">
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={12}
              slidesPerView={2}
              breakpoints={{ 640: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 6 } }}
              navigation
              speed={650}
              loop
              autoplay={{ delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }}
              grabCursor
              className="!px-3 sm:!px-4"
            >
              {items.map((raw, idx) => {
                const id = raw.id ?? idx;
                const name = raw.name ?? "بدون نام";
                const image = raw.image;
                const href = raw.href ?? `/product/${id}`;

                const price = toNum(raw.price);
                const oldPrice = toNum(raw.oldPrice);
                const percent = calcPercent(price, oldPrice, raw.discountPercent);

                return (
                  <SwiperSlide key={id}>
                    <article className="h-full rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                      <Link href={href} className="block relative w-full aspect-[3/4] bg-[#F8F7F6]">
                        {percent > 0 && (
                          <span className="absolute top-2 right-2 z-10 bg-rose-600 text-white text-[11px] font-extrabold px-2 py-1 rounded-full shadow">
                            %{toFa(percent)}
                          </span>
                        )}
                        <Image
                          src={image}
                          alt={name}
                          fill
                          sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 16vw"
                          className="object-cover"
                        />
                      </Link>

                      <div className="p-3 flex flex-col gap-1 grow">
                        <Link
                          href={href}
                          title={name}
                          className="block text-[13px] sm:text-sm font-semibold text-slate-900 leading-5 line-clamp-2 min-h-[2.5rem] hover:text-rose-600"
                        >
                          {name}
                        </Link>

                        <div className="mt-auto flex items-baseline gap-2">
                          <span className="text-rose-600 font-extrabold text-sm">
                            {toFa(price)} <span className="text-xs font-medium text-slate-500">تومان</span>
                          </span>
                          {oldPrice > price && (
                            <span className="text-xs text-slate-400 line-through">
                              {toFa(oldPrice)} تومان
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* دکمه‌های ناوبری (استایل‌دهی بهتر) */}
            <NavButton side="right" />
            <NavButton side="left" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[44px] text-center rounded-lg bg-white/95 text-rose-600 font-black text-lg px-2 py-1 leading-none">
        {value}
      </div>
      <div className="text-xs mt-1 opacity-90">{label}</div>
    </div>
  );
}

function NavButton({ side }: { side: "left" | "right" }) {
  const pos = side === "right" ? "right-1 sm:right-2" : "left-1 sm:left-2";
  const dir = side === "right" ? "rtl" : "ltr";
  return (
    <button
      className={`swiper-button-${side} !absolute top-1/2 -translate-y-1/2 ${pos} !h-9 !w-9 rounded-full bg-white/90 border border-zinc-200 shadow hover:bg-white`}
      aria-label={side === "right" ? "بعدی" : "قبلی"}
      dir={dir}
    />
  );
}
