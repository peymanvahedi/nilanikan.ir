// src/components/CategoryProductsSection.tsx
"use client";

import { useMemo } from "react";
import ProductsGrid from "@/components/ProductsGrid";
import type { ProductLike } from "@/components/ProductCard";

/**
 * ورودی products همون آرایه‌ی خروجی API لیست محصولاته.
 * این کامپوننت فقط اونو به ProductLike نگاشت می‌کنه و به ProductsGrid می‌ده.
 */
export default function CategoryProductsSection({
  products,
  total,
  title = "محصولات",
  hrefBase = "/product",
  loading = false,
}: {
  products: any[];
  total?: number;
  title?: string;
  hrefBase?: string | false; // برای باندل‌ها بدید "/bundle"
  loading?: boolean;
}) {
  const items: ProductLike[] = useMemo(
    () =>
      (Array.isArray(products) ? products : []).map((p) => ({
        id: p?.id,
        slug: p?.slug ?? (p?.id != null ? String(p.id) : undefined),
        name: p?.name ?? "بدون نام",
        brand: p?.brand ?? null,
        price: p?.price,
        discount_price: p?.discount_price ?? null,
        imageUrl: p?.imageUrl,                // اگر داشتید
        image: p?.image ?? null,
        images: p?.images ?? null,
        gallery: p?.gallery ?? null,
        // optionally UI badges:
        ribbon: p?.ribbon,
        ribbonTone: p?.ribbonTone,
        tag: p?.tag,
      })),
    [products]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
      <ProductsGrid
        title={title}
        items={items}
        total={typeof total === "number" ? total : items.length}
        hrefBase={hrefBase}
        initialSort="newest"
        loading={loading}
      />
    </div>
  );
}
