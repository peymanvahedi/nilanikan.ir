"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

// --- جملات آماده: «نظر بچه‌هایی که خرید کردن»
const TEASERS: string[] = [
  "مامان گفت چه خوشتیپ شدی! 🤩",
  "رفیقام گفتن لباسمو خیلی دوست دارن 😍",
  "این لباسو پوشیدم همه گفتن وای چه نازه! 🧸",
  "تولد رفتم همه نگاها روم بود 😎✨",
  "بابام گفت مثل مدل شدی! 👔",
  "با این لباس همه گفتن چه خوشگل شدم 🌟",
  "باهاش عکس گرفتم، همه گفتن عالی شده 📸💖",
  "خیلی راحته، همش دلم می‌خواد بپوشمش 👕👶",
];

// انتخاب پایدار بر اساس id/title تا هر بار همین استوری همان متن را بگیرد
function pickStableTeaserIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % TEASERS.length;
}

const absolutize = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("/media/")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return API_ORIGIN ? `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}` : url;
};

export type StoryItem = {
  id?: number | string;
  imageUrl?: string | null;
  image?: string | null;
  title?: string | null;
  name?: string | null;
  href?: string | null;       // یا ممکنه link/url بیاد
  link?: string | null;
  url?: string | null;
  ctaLabel?: string | null;
  teaser?: string | null;     // اگر بیاد، همونو نشان می‌دهیم
};

type Props = { items: StoryItem[] };

export default function StorySliderWrapper({ items }: Props) {
  const stories = useMemo(
    () =>
      (items ?? [])
        .map((s, i) => {
          const rawTitle = (s.title ?? s.name ?? "").trim();
          // لینک را از چند فیلد بخوان و تمیز کن
          const hrefRaw = String((s.href ?? s.link ?? s.url ?? "")).trim();
          const href = hrefRaw.length ? hrefRaw : undefined;

          // ساخت Teaser خودکار اگر از بک‌اند نیاید (پایدار بر اساس id/title)
          const idSeed = String(s.id ?? i);
          const seed = `${idSeed}::${rawTitle}`;
          const fallbackTeaser = TEASERS[pickStableTeaserIndex(seed)];

          return {
            id: String(s.id ?? i),
            src: absolutize(s.imageUrl ?? s.image ?? ""),
            title: rawTitle || "تن‌خور جذاب بچه‌ها",
            href, // فقط اگر واقعی باشد
            ctaLabel: (s.ctaLabel ?? "بریم برای خرید 🎁").trim(),
            teaser: (s.teaser ?? "").trim() || fallbackTeaser,
          };
        })
        .filter((s) => !!s.src),
    [items]
  );

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;
  const current = isOpen ? stories[openIndex!] : null;

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    if (!stories.length || openIndex === null) return;
    setOpenIndex((i) => ((i! + 1) % stories.length));
  }, [stories.length, openIndex]);
  const prev = useCallback(() => {
    if (!stories.length || openIndex === null) return;
    setOpenIndex((i) => ((i! - 1 + stories.length) % stories.length));
  }, [stories.length, openIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close, next, prev]);

  // Swipe
  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const first = e.touches?.[0];
    if (first) touchStartX.current = first.clientX;
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const last = e.changedTouches?.[0];
    if (!last) return;
    const dx = last.clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
  };

  // Viewport fit
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => {
      setVp({
        w: Math.min(window.innerWidth * 0.96, 1200),
        h: Math.min(window.innerHeight * 0.94, window.innerHeight * 0.86),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Natural/render size
  const [natural, setNatural] = useState<{ w: number; h: number }>({ w: 800, h: 1000 });
  const HEADER_H = 56;
  const FOOTER_H = current?.href ? 88 : 20;
  const availableH = Math.max(120, vp.h - HEADER_H - FOOTER_H);
  const scale = Math.min(vp.w / natural.w, availableH / natural.h, 1);
  const renderW = Math.max(240, Math.floor(natural.w * scale));
  const renderH = Math.max(260, Math.floor(natural.h * scale));

  if (!stories.length) return null;

  return (
    <div className="w-full">
      <div className="mb-3 px-1">
        <h2 className="text-base font-bold text-slate-900">استوری تن‌خور</h2>
      </div>

      {/* Cards */}
      <div className="flex gap-4 sm:gap-5 overflow-x-auto px-1 pb-2
                      [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((st, idx) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setOpenIndex(idx)}
            className="group w-[152px] sm:w-[176px] shrink-0 text-right outline-none"
            aria-label={st.title}
          >
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-[#fff7f2]
                            ring-1 ring-black/5 shadow-sm transition group-hover:shadow-md">
              <Image
                src={st.src}
                alt={st.title}
                fill
                className="object-cover"
                sizes="176px"
                unoptimized
              />

              {/* گرادیان و متن داخل تصویر، پایین */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 via-black/35 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                <p className="text-[12px] sm:text-[13px] font-semibold leading-5 line-clamp-2">
                  {st.title}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {isOpen && current && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} />

          <div
            className="relative z-[101] bg-white rounded-3xl overflow-hidden grid grid-rows-[auto_1fr_auto]"
            style={{ width: `${renderW}px`, maxWidth: "96vw", maxHeight: "94svh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">تن‌خور</h3>
              <button
                onClick={close}
                aria-label="بستن"
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Image + overlay + arrows */}
            <div className="relative bg-black flex items-center justify-center px-3 pb-3">
              <div className="relative" style={{ width: renderW, height: renderH }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.src}
                  alt={current.title}
                  width={renderW}
                  height={renderH}
                  style={{ width: renderW, height: renderH }}
                  className="block object-contain"
                  onLoad={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    if (el.naturalWidth && el.naturalHeight) {
                      setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                    }
                  }}
                />

                {/* Teaser overlay: کشیده و وسط پایین */}
                <div className="absolute inset-x-3 bottom-3 pointer-events-none flex justify-center">
                  <div
                    className="
                      w-full max-w-[min(92%,720px)]
                      rounded-2xl px-4 py-2.5
                      bg-black/55 text-white
                      text-xs sm:text-sm font-bold text-center leading-relaxed
                      backdrop-blur-[2px] shadow-md
                      break-words
                    "
                    dir="rtl"
                  >
                    {current.teaser}
                  </div>
                </div>

                {/* Arrows */}
                <button
                  onClick={prev}
                  aria-label="قبلی"
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full
                             bg-white/90 hover:bg-white shadow transition"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  aria-label="بعدی"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full
                             bg-white/90 hover:bg-white shadow transition"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Footer: CTA only if href exists */}
            <div className="flex justify-center px-4 py-3">
              {current.href ? (
                <Link
                  href={current.href}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold
                             text-white bg-pink-600 hover:bg-pink-700 shadow-md transition active:translate-y-[1px]"
                >
                  {current.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
