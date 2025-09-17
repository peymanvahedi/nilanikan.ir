"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductItem } from "@/types/home";

/* ---------- helpers ---------- */
const num = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

// اگر عدد خیلی بزرگ بود احتمالاً ریال است → ÷۱۰، وگرنه تومانِ آماده است
const toTomanSmart = (rialOrToman?: number) => {
  if (!rialOrToman || !Number.isFinite(rialOrToman)) return 0;
  return rialOrToman >= 500_000 ? Math.round(rialOrToman / 10) : Math.round(rialOrToman);
};

const fmt = (toman: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.max(0, Math.round(toman))) + " تومان";

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

// قیمت نهایی و قیمت اصلی را از فیلدهای رایج می‌خوانیم، واحد را هوشمند تشخیص می‌دهیم
function resolvePrices(p: any) {
  const finalRaw =
    num(p?.final_price) ??
    num(p?.finalPrice) ??
    num(p?.sale_price) ??
    num(p?.salePrice) ??
    num(p?.price) ??
    num(p?.price_rial) ??
    num(p?.priceRial) ??
    0;

  const baseRaw =
    num(p?.original_price) ??
    num(p?.originalPrice) ??
    num(p?.compare_at_price) ??
    num(p?.compareAtPrice) ??
    num(p?.list_price) ??
    num(p?.listPrice) ??
    0;

  const priceT = toTomanSmart(finalRaw);
  const baseT = toTomanSmart(baseRaw);

  const off =
    baseT > priceT && priceT > 0
      ? Math.round(((baseT - priceT) / baseT) * 100)
      : 0;

  return { priceT, baseT, off };
}

/* ---------- countdown ---------- */
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

/* ---------- component ---------- */
export default function BestSellersSlider({
  products = [],
  endsAt,
  seeAllLink = "/bestsellers",
  title = "پرفروش‌ترین‌ها",
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
            const href = hrefOf(p);
            const { priceT, baseT, off } = resolvePrices(p);
            const hasOff = baseT > priceT && priceT > 0;

            return (
              <article
                key={`${p?.id ?? "id"}-${idx}`}
                className="shrink-0 snap-center
                           w-[45%] sm:w-[48%] md:w-[32%] lg:w-[24%] xl:w-[20%]
                           rounded-[20px] bg-white ring-1 ring-zinc-200 shadow
                           hover:shadow-md transition-all duration-300 ease-out overflow-hidden p-3"
              >
                <Link href={href} className="block">
                  <div className="relative w-full aspect-[4/5] rounded-[16px] overflow-hidden">
                    {/* فقط وقتی تصویر داریم نمایش بده؛ در خطا، تصویر مخفی شود */}
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
                      پرفروش
                    </span>
                    {hasOff && (
                      <span className="absolute left-0 top-2 z-10 rounded-r-xl px-2 py-1 text-[11px] font-extrabold bg-emerald-600 text-white">
                        %{new Intl.NumberFormat("fa-IR").format(off)}-
                      </span>
                    )}
                  </div>

                  <div className="pt-3 text-right">
                    <h3 className="text-sm font-bold text-slate-900 leading-6 line-clamp-2">
                      {p?.name ?? p?.title ?? "بدون نام"}
                    </h3>

                    <div className="mt-2 text-sm font-extrabold text-pink-600">
                      {fmt(priceT)}
                    </div>
                    {hasOff && (
                      <div className="text-xs text-slate-400 line-through mt-0.5">
                        {fmt(baseT)}
                      </div>
                    )}
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
