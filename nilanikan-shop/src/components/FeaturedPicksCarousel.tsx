"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export type FeaturedItem = {
  id: number | string;
  name: string;      // فقط برای alt/title استفاده می‌شود (روی UI نمایش داده نمی‌شود)
  image: string;     // آدرس تصویر
  href?: string;     // لینک محصول
};

export default function FeaturedPicksCarousel({
  items,
  title = "برگزیده‌ها",
  allLink = "/products",
}: {
  items?: FeaturedItem[];
  title?: string;
  allLink?: string;
}) {
  // نمونهٔ پیش‌فرض اگر آیتم ندهی
  const fallback: FeaturedItem[] = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `محصول ${i + 1}`,
    image: `https://picsum.photos/seed/featured-${i + 1}/800/1000`,
    href: `/product/${i + 1}`,
  }));
  const data = (items?.length ? items : fallback).map((x) => ({
    ...x,
    href: x.href ?? `/product/${x.id}`,
  }));

  const railRef = useRef<HTMLDivElement | null>(null);
  const scrollByStep = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * (window.innerWidth < 768 ? 0.85 : 0.7));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="w-full" dir="rtl" aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{title}</h2>
        <Link href={allLink} className="text-sm font-bold text-pink-600 hover:text-pink-700">
          مشاهده همه
        </Link>
      </div>

      <div className="relative">
        {/* دکمه‌های پیمایش */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-1">
          <button
            onClick={() => scrollByStep(1)}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-pink-700 shadow grid place-items-center hover:bg-pink-50"
            aria-label="بعدی"
            title="بعدی"
          >
            ›
          </button>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-1">
          <button
            onClick={() => scrollByStep(-1)}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-pink-700 shadow grid place-items-center hover:bg-pink-50"
            aria-label="قبلی"
            title="قبلی"
          >
            ‹
          </button>
        </div>

        {/* ریل اسکرول افقی – فقط تصویر */}
        <div
          ref={railRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {data.map((it) => (
            <Link
              key={it.id}
              href={it.href!}
              className="shrink-0 w-[68%] sm:w-[42%] md:w-[30%] lg:w-[22%] xl:w-[18%] snap-start
                         rounded-xl overflow-hidden ring-1 ring-zinc-200 shadow hover:shadow-md transition
                         outline-none focus-visible:ring-2 focus-visible:ring-pink-600"
              aria-label={`مشاهده ${it.name}`}
              title={it.name}
            >
              {/* نسبت 4:5 شبیه کاور محصول، بدون متن */}
              <div className="relative w-full aspect-[4/5]">
                <Image
                  src={it.image}
                  alt={it.name}
                  fill
                  sizes="(max-width:640px) 68vw, (max-width:1024px) 42vw, (max-width:1280px) 30vw, 22vw"
                  className="object-cover bg-white"
                  priority={false}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
