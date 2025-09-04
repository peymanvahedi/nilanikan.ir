"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { ProductsGrid } from "@/components/catalog/ProductsGrid";

// ⬇️ مقادیر و توابع
import { buildQueryFromParams, defaultQueryState } from "../../lib/catalog/query";
// ⬇️ فقط تایپ
import type { QueryState } from "../../lib/catalog/query";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const initialState: QueryState = useMemo(
    () => ({
      ...defaultQueryState,
      q: searchParams.get("q") ?? "",
      category: searchParams.getAll("category"),
      types: searchParams.getAll("type"),
      colors: searchParams.getAll("color"),
      sizes: searchParams.getAll("size"),
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      sort: (searchParams.get("sort") as QueryState["sort"]) ?? "latest",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      perPage: searchParams.get("perPage")
        ? Number(searchParams.get("perPage"))
        : 24,
    }),
    [searchParams]
  );

  const [query, setQuery] = useState<QueryState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ items: any[]; total: number }>({
    items: [],
    total: 0,
  });

  // debounce برای q
  const [debouncedQ, setDebouncedQ] = useState(query.q);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query.q), 400);
    return () => clearTimeout(id);
  }, [query.q]);

  // Sync URL with state
  useEffect(() => {
    const params = buildQueryFromParams({ ...query, q: debouncedQ });
    const current = searchParams.toString();
    const next = params.toString();
    if (current !== next) router.replace(`/products?${next}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, debouncedQ, router]);

  // Fetch از بک‌اند
  useEffect(() => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const params = buildQueryFromParams({ ...query, q: debouncedQ }).toString();

    // حذف اسلش‌های انتهایی
    const base = API_BASE ? API_BASE.replace(/\/+$/, "") : "";
    // ✅ DRF معمولاً اسلش انتهایی دارد
    const endpoint = base ? `${base}/products/?${params}` : `/api/products?${params}`;

    fetch(endpoint, { signal: controller.signal })
      .then(async (r) => {
        // متن پاسخ را برای پیام خطا نگه می‌داریم
        const text = await r.text().catch(() => "");
        if (!r.ok) {
          throw new Error(`HTTP ${r.status} ${r.statusText} | ${text.slice(0, 200)}`);
        }
        // اگر OK بود، JSON کن
        try {
          return JSON.parse(text || "{}");
        } catch {
          throw new Error("Invalid JSON from API");
        }
      })
      .then((json) => {
        // مبنا برای ساخت URL کامل عکس‌ها (اگر API_BASE = http://127.0.0.1:8000/api → origin = http://127.0.0.1:8000)
        const SITE_ORIGIN = API_BASE
          ? API_BASE.replace(/\/+$/, "").replace(/\/api$/, "")
          : "";

        const abs = (u?: string) => {
          if (!u) return u;
          if (/^https?:\/\//i.test(u)) return u;
          const baseUrl = SITE_ORIGIN || "";
          const sep = u.startsWith("/") ? "" : "/";
          return `${baseUrl}${sep}${u}`;
        };

        // پشتیبانی از 3 مدل پاسخ رایج
        let raw: any[] = [];
        let total = 0;

        if (Array.isArray(json)) {
          raw = json;
          total = json.length;
        } else if (json?.results) {
          raw = json.results;
          total = json.count ?? json.results.length ?? 0;
        } else if (json?.items) {
          raw = json.items;
          total = json.total ?? json.items.length ?? 0;
        } else if (json?.data) {
          const d = json.data;
          if (Array.isArray(d)) {
            raw = d;
            total = d.length;
          } else if (d?.results) {
            raw = d.results;
            total = d.count ?? d.results.length ?? 0;
          }
        }

        // نگاشت فیلدها به چیزی که گرید می‌خواند
        const items = raw.map((p) => {
          const title = p.title ?? p.name ?? p.sku ?? "بدون‌نام";
          const image =
            abs(p.image) ||
            abs(p.thumbnail) ||
            abs(p.cover) ||
            abs(p.primary_image) ||
            undefined;
          const price = p.price ?? p.unit_price ?? 0;
          const id = p.id ?? p.slug ?? title;
          const created = p.created ?? p.created_at ?? null;
          return { ...p, id, title, price, image, created };
        });

        // برای دیباگ سریع اولین آیتم رو تو کنسول ببین
        if (process.env.NODE_ENV !== "production") {
          console.log("PRODUCTS_ENDPOINT", endpoint);
          console.log("FIRST_ITEM_NORMALIZED", items[0]);
        }

        setData({ items, total });
      })
      .catch((e: any) => {
        if (e?.name !== "AbortError") {
          console.error("PRODUCTS_FETCH_ERROR", { endpoint, error: e?.message });
          setError(`خطا: ${e?.message}\nURL: ${endpoint}`);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [API_BASE, query, debouncedQ]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        <FilterPanel
          value={{ ...query, q: debouncedQ }}
          onChange={(v: QueryState) => setQuery(v)}
        />
      </aside>

      <main className="lg:col-span-9">
        {error && (
          <div className="mb-3 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <ProductsGrid
          loading={loading}
          items={data.items}
          total={data.total}
          page={query.page}
          perPage={query.perPage}
          onPageChange={(p: number) => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setQuery((q: QueryState) => ({ ...q, page: p }));
          }}
          sort={query.sort}
          onSortChange={(s: string) =>
            setQuery((q: QueryState) => ({
              ...q,
              sort: s as QueryState["sort"],
              page: 1,
            }))
          }
        />
      </main>
    </div>
  );
}
