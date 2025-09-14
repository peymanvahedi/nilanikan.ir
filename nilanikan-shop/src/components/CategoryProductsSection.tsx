// src/components/CategoryProductsSection.tsx
"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductsGrid from "@/components/ProductsGrid";
import type { ProductLike } from "@/components/ProductCard";

/* ---------------------------------- Types --------------------------------- */
type MenuCategory = {
  id: number | string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  children?: MenuCategory[];
};

/* ---------------------- Helpers for robust menu fetch ---------------------- */
async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}

/** سعی می‌کنه منو را از چند مسیر بسازد تا مشکل اسلش/Rewrite/CORS گیر نکند */
async function getMenuSafe(): Promise<{ items: MenuCategory[]; source: string }> {
  // 1) مسیر استاندارد ویوسِت: /api/categories/menu/
  const tries = ["/api/categories/menu/", "/api/categories/menu", "/api/categories/"];
  const errors: any[] = [];

  for (const u of tries) {
    try {
      const data = await fetchJSON(u);
      // اگر /menu نبود و /categories/ بود، فقط ریشه‌هایی که show_in_menu=true باشند را انتخاب کنید (در حد حدس)
      if (Array.isArray(data)) {
        return { items: data as MenuCategory[], source: u };
      }
      if (Array.isArray((data as any).results)) {
        // نتایج صفحه‌بندی شده
        return { items: (data as any).results as MenuCategory[], source: u };
      }
      // اگر شیء با کلید children داشت
      if (data && typeof data === "object" && Array.isArray((data as any).children)) {
        return { items: (data as any).children as MenuCategory[], source: u };
      }
    } catch (e) {
      errors.push({ url: u, err: String(e) });
      continue;
    }
  }

  // اگر همه شکست خورد
  console.warn("Menu fetch failed", errors);
  return { items: [], source: "failed" };
}

/* ----------------------------- Menu (Inline) ------------------------------- */
function CategoryMenuInline() {
  const [items, setItems] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { items, source } = await getMenuSafe();
        if (!alive) return;
        setItems(items || []);
        setSrc(source);
        if (!items?.length) setErr("منوی دسته‌بندی خالی است یا از API دریافت نشد.");
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "خطا در دریافت منو");
        console.error("Category menu error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      {/* نوار خطا/منبع برای دیباگ سریع — در محیط پروداکشن می‌تونی حذفش کنی */}
      {err ? (
        <div
          className="w-full bg-amber-50 text-amber-800 border-y border-amber-200 px-4 py-2 text-xs"
          dir="rtl"
        >
          {err} {src ? <span className="opacity-70">(from: {src})</span> : null}
        </div>
      ) : null}

      {loading ? (
        <nav className="w-full border-b border-zinc-200 bg-white/70 backdrop-blur py-3" dir="rtl">
          <div className="container mx-auto px-4 text-sm text-zinc-500">در حال بارگذاری منو…</div>
        </nav>
      ) : !items.length ? null : (
        <nav className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60" dir="rtl">
          <div className="container mx-auto px-4">
            <ul className="flex items-center gap-3 overflow-x-auto py-3 no-scrollbar">
              {items.map((it) => (
                <li key={it.slug} className="relative group">
                  <Link
                    href={`/category/${it.slug}`}
                    className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-zinc-100 transition whitespace-nowrap"
                    onClick={() => console.log("menu click:", it.slug)}
                  >
                    {it.icon ? (
                      <Image
                        src={it.icon}
                        alt={it.name}
                        width={20}
                        height={20}
                        className="rounded-md object-cover"
                      />
                    ) : null}
                    <span className="text-sm">{it.name}</span>
                  </Link>

                  {it.children?.length ? (
                    <div className="absolute right-0 hidden group-hover:block mt-2 z-40 w-[min(92vw,860px)]">
                      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {it.children.map((c) => (
                          <div key={c.slug} className="min-w-0">
                            <Link
                              href={`/category/${c.slug}`}
                              className="flex items-center gap-2 rounded-lg p-2 hover:bg-zinc-100 transition"
                            >
                              {c.icon ? (
                                <Image
                                  src={c.icon}
                                  alt={c.name}
                                  width={22}
                                  height={22}
                                  className="rounded-md object-cover"
                                />
                              ) : null}
                              <span className="text-sm font-medium truncate">{c.name}</span>
                            </Link>
                            {c.children?.length ? (
                              <div className="mt-1 ms-7 flex flex-wrap gap-2">
                                {c.children.map((cc) => (
                                  <Link
                                    key={cc.slug}
                                    href={`/category/${cc.slug}`}
                                    className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline"
                                  >
                                    {cc.name}
                                  </Link>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}

                        {it.image ? (
                          <div className="col-span-2 md:col-span-1 overflow-hidden rounded-2xl border border-zinc-200">
                            <Image
                              src={it.image}
                              alt={it.name}
                              width={640}
                              height={360}
                              className="h-full w-full object-cover"
                              priority={false}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </>
  );
}

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
  showMenu = true, // ← نمایش منوی دسته‌بندی
}: {
  products: any[];
  total?: number;
  title?: string;
  hrefBase?: string | false; // برای باندل‌ها بدید "/bundle"
  loading?: boolean;
  showMenu?: boolean;
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
        imageUrl: p?.imageUrl, // اگر API می‌دهد
        image: p?.image ?? null,
        images: p?.images ?? null,
        gallery: p?.gallery ?? null,
        ribbon: p?.ribbon,
        ribbonTone: p?.ribbonTone,
        tag: p?.tag,
      })),
    [products]
  );

  return (
    <div className="mx-auto max-w-7xl px-0 md:px-4 py-0 md:py-6" dir="rtl">
      {showMenu ? <CategoryMenuInline /> : null}

      <div className="px-4 py-6">
        <ProductsGrid
          title={title}
          items={items}
          total={typeof total === "number" ? total : items.length}
          hrefBase={hrefBase}
          initialSort="newest"
          loading={loading}
        />
      </div>
    </div>
  );
}
