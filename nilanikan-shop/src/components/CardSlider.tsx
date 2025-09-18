// src/components/CardSlider.tsx
"use client";

import Link from "next/link";
import ProductCard, { ProductLike } from "./ProductCard";

type Props = {
  title?: string;
  items: ProductLike[];
  ctaHref?: string;
  ctaText?: string;
  hrefBase?: string | false;
  itemRibbon?: string;
  itemRibbonTone?: "pink" | "emerald" | "zinc";
  variant?: "compact" | "default";
  className?: string;
};

export default function CardSlider({
  title,
  items = [],
  ctaHref,
  ctaText = "مشاهده همه",
  hrefBase,
  itemRibbon,
  itemRibbonTone,
  variant = "default",
  className = "",
}: Props) {
  const data = Array.isArray(items) ? items : [];

  return (
    <section className={className} dir="rtl">
      {(title || ctaHref) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
              {title}
            </h2>
          )}
          {ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex h-9 px-4 items-center justify-center rounded-lg bg-pink-600 text-white text-sm font-extrabold shadow hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {ctaText}
            </Link>
          )}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
        {data.map((it, idx) => (
          <ProductCard
            key={`${it.id ?? it.slug ?? idx}`}
            item={{
              ...it,
              ribbon: it?.ribbon ?? itemRibbon,
              ribbonTone: it?.ribbonTone ?? itemRibbonTone,
            }}
            hrefBase={hrefBase}
            className={
              variant === "compact"
                ? "w-[45%] sm:w-[48%] md:w-[32%] lg:w-[24%] xl:w-[20%] shrink-0 snap-center"
                : "w-[60%] sm:w-[40%] md:w-[32%] lg:w-[24%] xl:w-[20%] shrink-0 snap-center"
            }
          />
        ))}
      </div>
    </section>
  );
}
