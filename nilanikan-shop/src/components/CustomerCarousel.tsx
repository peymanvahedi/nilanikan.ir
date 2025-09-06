"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = { id: number; src: string; name: string; product: string; href?: string };

const STORIES_API = "/api/stories/";

function ensureTwenty<T>(arr: T[], filler?: T): T[] {
  if (arr.length === 0) {
    return filler ? Array.from({ length: 20 }, () => filler) : [];
  }
  const out: T[] = arr.slice(0, 20);
  let i = 0;
  while (out.length < 20) {
    out.push(arr[i % arr.length]!);
    i++;
  }
  return out;
}

export default function CustomerCarousel() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    const ac = new AbortController();
    async function run() {
      try {
        const res = await fetch(STORIES_API, { cache: "no-store", signal: ac.signal });
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.results ?? []);
        const mapped: Item[] = (list as any[]).map((it, idx) => ({
          id: it.id ?? idx + 1,
          src: it.imageUrl || it.image || "",
          name: it.link ? "مشاهده" : `استوری ${idx + 1}`,
          product: it.title ?? `استوری ${idx + 1}`,
          href: it.link ?? undefined,
        }));
        setItems(ensureTwenty(mapped));
      } catch {
        setItems([]);
      }
    }
    run();
    return () => ac.abort();
  }, []);

  const current =
    openIndex !== null && openIndex >= 0 && openIndex < items.length ? items[openIndex] : null;

  const scrollByStep = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * (window.innerWidth < 768 ? 0.9 : 0.8));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  const next = () => scrollByStep(1);
  const prev = () => scrollByStep(-1);

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
  }, [openIndex, close, items.length]);

  const goNextModal = () => setOpenIndex((i) => (i! + 1) % items.length);
  const goPrevModal = () => setOpenIndex((i) => (i! - 1 + items.length) % items.length);

  return (
    <section className="w-full" aria-label="گالری مشتریان (کاروسل)">
      {/* هدر + کنترل‌ها */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800">عکس تنخور بچه‌هایی که از ما خرید کردن</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            className="w-8 h-8 rounded-full bg-[#F4E3D6] shadow hover:bg-[#EED8C7] grid place-items-center text-slate-700"
            aria-label="اسکرول به چپ"
            title="قبلی"
          >
            ‹
          </button>
          <button
            type="button"
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
          className="flex gap-4 lg:!gap-2 xl:!gap-1 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 pb-2 
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it, i) => (
            <button
              type="button"
              key={`${it.id}-${i}`}
              onClick={() => open(i)}
              className="group shrink-0 w-[56%] sm:w-[32%] md:w-[24%] lg:w-[23%] xl:w-[18%] 
                         snap-start rounded-xl bg-white shadow-md hover:shadow-xl hover:-translate-y-1
                         transition-all duration-300 ease-out overflow-hidden 
                         outline-none focus:ring-2 focus:ring-pink-500"
              title={`${it.product} - ${it.name}`}
              aria-label={`مشاهده ${it.product}`}
            >
              {/* تصویر با متن داخل خودش (پایین تصویر) */}
              <div className="relative w-full aspect-[3/4]">
                <Image
                  src={it.src || "/placeholder-product.png"}
                  alt={it.product}
                  fill
                  sizes="(max-width:640px) 56vw, (max-width:1024px) 32vw, (max-width:1280px) 24vw, 18vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  priority={it.id <= 4}
                  draggable={false}
                />

                {/* گرادیان خوانایی متن */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />

                {/* متن در پایین تصویر */}
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 text-white">
                  <p className="text-[12px] sm:text-[13px] font-semibold leading-5 sm:leading-6 line-clamp-1">
                    {it.product}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] sm:text-[12px] opacity-90 line-clamp-1">{it.name}</p>
                    <span className="text-[11px] sm:text-[12px] px-2 py-0.5 rounded-md bg-pink-600/90 group-hover:bg-pink-600">
                      مشاهده
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* مودال پاپ‌آپ */}
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
              src={current.src || "/placeholder-product.png"}
              alt={current.product}
              fill
              sizes="(max-width: 768px) 90vw, 70vw"
              className="object-contain"
            />

            {/* کنترل‌های مودال */}
            <button
              onClick={goPrevModal}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-slate-800 grid place-items-center hover:bg-white"
              aria-label="قبلی"
              title="قبلی"
            >
              ‹
            </button>
            <button
              onClick={goNextModal}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-slate-800 grid place-items-center hover:bg-white"
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
