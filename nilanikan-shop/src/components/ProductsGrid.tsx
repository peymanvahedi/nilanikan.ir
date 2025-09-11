// src/components/ProductsGrid.tsx
"use client";

import { useMemo, useState } from "react";
import ProductCard, { ProductLike } from "./ProductCard";
import { ChevronDown } from "lucide-react";

type SortKey = "newest" | "bestseller" | "price_asc" | "price_desc" | "discount_desc";

export type ProductsGridProps = {
  items: ProductLike[];
  hrefBase?: string | false;      // "/product" یا "/bundle"؛ اگر false باشد، از href خود آیتم استفاده می‌شود
  loading?: boolean;              // اسکلتی نشان بده
  total?: number;                 // مجموع کالاها (برای نمایش بالای لیست)
  title?: string;                 // عنوان بخش (مثلا عنوان دسته)
  initialSort?: SortKey;
  className?: string;
};

function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}

export default function ProductsGrid({
  items,
  hrefBase = "/product",
  loading = false,
  total,
  title,
  initialSort = "newest",
  className = "",
}: ProductsGridProps) {
  const [openSort, setOpenSort] = useState(false);
  const [sort, setSort] = useState<SortKey>(initialSort);

  const sorted = useMemo(() => {
    const data = [...items];
    switch (sort) {
      case "price_asc":
        data.sort((a, b) => Number(a.price ?? 9e15) - Number(b.price ?? 9e15));
        break;
      case "price_desc":
        data.sort((a, b) => Number(b.price ?? -1) - Number(a.price ?? -1));
        break;
      case "discount_desc":
        data.sort((a, b) => {
          const ap = Number(a.price ?? 0), ad = Number(a.discount_price ?? ap);
          const bp = Number(b.price ?? 0), bd = Number(b.discount_price ?? bp);
          const aOff = ap ? Math.round((1 - ad / ap) * 100) : 0;
          const bOff = bp ? Math.round((1 - bd / bp) * 100) : 0;
          return bOff - aOff;
        });
        break;
      case "bestseller":
        // اگر فیلدی برای فروش برتر دارید، اینجا استفاده کنید؛ فعلاً بدون تغییر
        break;
      case "newest":
      default:
        // اگر تاریخ دارید می‌تونید بر اساس آن مرتب کنید؛ فعلاً بدون تغییر
        break;
    }
    return data;
  }, [items, sort]);

  const skeletonCount = 12;

  return (
    <section className={`w-full ${className}`} dir="rtl">
      {/* سربرگ و مرتب‌سازی */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          {title && <span className="font-bold text-zinc-900">{title}</span>}{" "}
          {typeof total === "number" && (
            <span className="text-zinc-500">({toFa(total)} کالا)</span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenSort((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
            aria-expanded={openSort}
          >
            مرتب‌سازی <ChevronDown size={16} />
          </button>
          {openSort && (
            <ul
              onMouseLeave={() => setOpenSort(false)}
              className="absolute left-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
            >
              {[
                ["newest", "جدیدترین"],
                ["bestseller", "پرفروش‌ترین"],
                ["discount_desc", "بیشترین تخفیف"],
                ["price_asc", "ارزان‌ترین"],
                ["price_desc", "گران‌ترین"],
              ].map(([key, label]) => (
                <li key={key}>
                  <button
                    onClick={() => {
                      setSort(key as SortKey);
                      setOpenSort(false);
                    }}
                    className={`block w-full px-3 py-2 text-right text-sm hover:bg-zinc-50 ${
                      sort === key ? "text-pink-600 font-bold" : "text-zinc-700"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* گرید محصولات */}
      <div
        className="
          grid gap-4
          grid-cols-2
          sm:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
        "
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-3"
              >
                <div className="aspect-[4/5] w-full rounded-xl bg-zinc-100" />
                <div className="mt-3 h-3 w-3/4 rounded bg-zinc-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-zinc-100" />
                <div className="mt-4 h-4 w-1/3 rounded bg-zinc-100" />
              </div>
            ))
          : sorted.map((it, i) => (
              <ProductCard
                key={(it.slug ?? it.id ?? i) as any}
                item={it}
                hrefBase={hrefBase}
                className="h-full"
                // روبان و برچسب نمونه؛ در صورت نیاز مقدار بده
                ribbon={it?.ribbon as any}            // مثل: "پرفروش"
                ribbonTone={it?.ribbonTone as any}    // "pink" | "emerald" | "zinc"
                tag={it?.tag as any}                  // مثل: "آگهی" یا "جدید"
              />
            ))}
      </div>
    </section>
  );
}
