"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatToman } from "@/lib/money";

export type SetItem = {
  id: number | string;
  slug?: string;           // برای لینک جزئیات
  name: string;
  image?: string;
  price?: number | string;
  href?: string;
};

const FALLBACK_IMG = "/placeholder-bundle.png";

export default function NilaNikanSetsSlider({
  items = [],
  title = "انواع ست",
  allLink = "/collection/set",
  autoplay = true,
  intervalMs = 4000,
}: {
  items?: SetItem[];
  title?: string;
  allLink?: string;
  autoplay?: boolean;
  intervalMs?: number;
}) {
  const data = (items?.length ? items : []).map((x) => ({
    ...x,
    href: x.href ?? `/bundle/${x.slug ?? x.id}`,
    image: x.image || FALLBACK_IMG,
  }));

  const railRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(1);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      if (w < 640) setPerView(1);
      else if (w < 768) setPerView(2);
      else if (w < 1024) setPerView(3);
      else if (w < 1280) setPerView(4);
      else setPerView(5);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / perView));

  const goTo = (idx: number) => {
    const el = railRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, totalPages - 1));
    const step = el.clientWidth;
    el.scrollTo({ left: clamped * step, behavior: "smooth" });
    setActive(clamped);
  };

  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  useEffect(() => {
    if (!autoplay || totalPages <= 1) return;
    const id = setInterval(() => {
      setActive((a) => {
        const n = (a + 1) % totalPages;
        const el = railRef.current;
        if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
        return n;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoplay, intervalMs, totalPages]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => {
      const step = el.clientWidth || 1;
      const n = Math.round(el.scrollLeft / step);
      setActive(Math.max(0, Math.min(n, totalPages - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [totalPages]);

  if (!data.length) return null;

  return (
    <section className="w-full" dir="rtl" aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{title}</h2>
        <Link href={allLink} className="text-sm font-bold text-pink-600 hover:text-pink-700">
          مشاهده همه
        </Link>
      </div>

      <div className="relative">
        {/* ناوبری */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-1">
          <button
            onClick={prev}
            className="pointer-events-auto w-8 h-8 md:w-9 md:h-9 rounded-full bg-white text-pink-700 shadow grid place-items-center hover:bg-pink-50"
            aria-label="قبلی"
            title="قبلی"
          >
            ‹
          </button>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-1">
          <button
            onClick={next}
            className="pointer-events-auto w-8 h-8 md:w-9 md:h-9 rounded-full bg-white text-pink-700 shadow grid place-items-center hover:bg-pink-50"
            aria-label="بعدی"
            title="بعدی"
          >
            ›
          </button>
        </div>

        {/* ریل اسلایدر */}
        <div
          ref={railRef}
          className="snap-x snap-mandatory snap-always overflow-x-auto no-scrollbar flex gap-2 sm:gap-3 py-1 scroll-smooth overscroll-x-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {data.map((s) => (
            <article
              key={s.id}
              className="shrink-0 snap-center
                         w-[45%] sm:w-[48%] md:w-[32%] lg:w-[24%] xl:w-[20%]
                         rounded-2xl bg-white ring-1 ring-zinc-200 shadow
                         hover:shadow-md transition-all duration-300 ease-out overflow-hidden"
            >
              <Link href={s.href!} className="block relative w-full aspect-square">
                {/* تصویر */}
                <Image
                  src={s.image || FALLBACK_IMG}
                  alt={s.name}
                  fill
                  sizes="(max-width:640px) 45vw, (max-width:768px) 48vw, (max-width:1024px) 32vw, (max-width:1280px) 24vw, 20vw"
                  className="object-cover bg-[#F9F5F2]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement & { src: string };
                    if (target?.src !== window.location.origin + FALLBACK_IMG) {
                      target.src = FALLBACK_IMG;
                    }
                  }}
                />

                {/* پوشش گرادیانی برای خوانایی متن */}
                <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-black/65 via-black/35 to-transparent pointer-events-none" />

                {/* متن داخل تصویر پایین */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 text-white">
                  <p className="text-xs sm:text-sm font-semibold leading-5 sm:leading-6 line-clamp-2">
                    {s.name}
                  </p>

                  <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold">
                      {formatToman(Number(s.price ?? 0))} <span className="opacity-85">تومان</span>
                    </span>
                    <span
                      className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-pink-600 text-white text-[11px] sm:text-xs font-bold grid place-items-center"
                      aria-hidden
                    >
                      مشاهده
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* دات‌ها */}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`اسلاید ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === active ? "bg-pink-600" : "bg-zinc-300 hover:bg-zinc-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
