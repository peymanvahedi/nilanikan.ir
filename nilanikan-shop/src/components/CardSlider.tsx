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
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-base md:text-lg font-extrabold">{title}</h2>
          )}
          {ctaHref && (
            <Link href={ctaHref} className="underline text-sm">
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
              // در صورت نیاز روبان را تزریق می‌کنیم تا همه کارت‌ها یکدست باشند
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
