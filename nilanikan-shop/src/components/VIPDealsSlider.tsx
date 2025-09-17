"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductItem } from "@/types/home";
import { formatToman } from "@/lib/money";

function Countdown({ endsAt }: { endsAt?: string }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const end = new Date(endsAt).getTime();
      const d = end - Date.now();
      if (d <= 0) return setTxt("00:00:00");
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setTxt(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!endsAt) return null;
  return <span className="text-sm font-bold text-amber-700">{txt}</span>;
}

const num = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

// ⛔️ بدون پیش‌فرض
const pickImg = (p: any): string | undefined =>
  p?.imageUrl ||
  p?.image ||
  (Array.isArray(p?.images) && p.images.find((x: any) => !!x)) ||
  (Array.isArray(p?.gallery) && p.gallery.map((g: any) => g?.image).find((x: any) => !!x)) ||
  undefined;

const hrefOf = (p: any): string => {
  if (p?.link) return p.link;
  if (p?.slug && p?.kind === "bundle") return `/bundle/${p.slug}`;
  if (p?.slug) return `/product/${p.slug}`;
  return "#";
};

export default function VIPDealsSlider({
  products = [],
  endsAt,
  seeAllLink = "/vip",
  title = "پیشنهادهای VIP",
}: {
  products?: ProductItem[];
  endsAt?: string;
  seeAllLink?: string;
  title?: string;
}) {
  const data = products ?? [];

  const wrapRef = useRef<HTMLDivElement>(null);
  const [perView, setPerView] = useState(2);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      if (w < 640) setPerView(2);
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

  return (
    <section className="w-full" dir="rtl" aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{title}</h2>
        <div className="flex items-center gap-2">
          <Countdown endsAt={endsAt} />
          <Link
            href={seeAllLink}
            className="inline-flex h-9 items-center rounded-lg bg-pink-600 px-3 text-white text-sm font-bold hover:bg-pink-700"
          >
            مشاهده همه
          </Link>
        </div>
      </div>

      <div className="relative">
        <div
          ref={wrapRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1"
        >
          {data.map((p: any, idx) => {
            const img = pickImg(p);
            const price = num(p?.price);
            const href = hrefOf(p);

            return (
              <article
                key={`${p?.id ?? "id"}-${idx}`}
                className="shrink-0 snap-center
                           w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5
                           rounded-[20px] bg-white ring-1 ring-zinc-200 shadow
                           hover:shadow-md transition-all duration-300 ease-out overflow-hidden p-3"
              >
                <Link href={href} className="block">
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
                    {/* فقط اگر تصویر داریم، نشان بده؛ در خطای لود، تصویر را مخفی کن */}
                    {img && (
                      <img
                        src={img}
                        alt={p?.name ?? p?.title ?? ""}
                        className="w-full h-full object-cover bg-[#F9F5F2]"
                        onError={(e: any) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span className="absolute right-0 top-2 z-10 rounded-l-xl px-2 py-1 text-[11px] font-extrabold bg-pink-600 text-white">
                      VIP
                    </span>
                  </div>
                  <div className="pt-3 text-right">
                    <h3 className="text-sm font-bold text-slate-900 leading-6 line-clamp-2">
                      {p?.name ?? p?.title ?? "بدون نام"}
                    </h3>
                    <div className="mt-2 text-sm font-extrabold text-pink-600">
                      {formatToman(price ?? 0)} تومان
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
