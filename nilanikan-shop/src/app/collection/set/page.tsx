// src/app/collection/set/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BundleCard, { type Bundle as BundleCardBundle } from "@/components/BundleCard";
import { get, endpoints, API_BASE, absolutizeMedia } from "@/lib/api";


// ImgLike مثل BundleCard
type ImgLike =
  | string
  | { url?: string; image?: string; src?: string | null }
  | null
  | undefined;

type SetsBundle = BundleCardBundle & {
  name?: string;
  image?: ImgLike;
  price_min?: number;
  price_max?: number;
  tags?: string[];
  products?: Array<{ image?: ImgLike; title?: string; slug?: string }>;
};

type ApiResponse = {
  results: any[];
  next?: string | null;
  count?: number;
};

// ——— helpers ———
function mapSort(v: string | null) {
  switch (v) {
    case "price_low":
      return "price_min";
    case "price_high":
      return "-price_max";
    case "popular":
      return "-popularity";
    default:
      return "-created"; // newest
  }
}

// ساخت path نسبی API براساس اندپوینت‌های داخلی پروژه
function buildApiPath(params: URLSearchParams, page = 1) {
  const p = new URLSearchParams();
  if (params.get("q")) p.set("search", params.get("q") as string);
  p.set("ordering", mapSort(params.get("sort")));

  if (params.get("minp")) p.set("min_price", params.get("minp") as string);
  if (params.get("maxp")) p.set("max_price", params.get("maxp") as string);
  if (params.get("size")) p.set("size", params.get("size") as string);
  if (params.get("age")) p.set("age", params.get("age") as string);
  if (params.get("season")) p.set("season", params.get("season") as string);
  p.set("type", "set");
  p.set("page", String(page));

  // endpoints.bundles == "/api/bundles/"
  return `${endpoints.bundles}?${p.toString()}`;
}

function makeAbs(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

function normalizeBundle(r: any): SetsBundle {
  return {
    id: r.id,
    slug: r.slug ?? String(r.id ?? ""),
    title: r.title ?? r.name ?? "بدون عنوان",
    name: r.name,
    image: r.image ?? r.imageUrl ?? (r.products?.[0]?.image ?? null),
    price_min: r.price_min ?? r.min_price ?? undefined,
    price_max: r.price_max ?? r.max_price ?? undefined,
    tags: r.tags ?? [],
    products: r.products ?? [],
  };
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ——— page ———
export default function SetsPage() {
  const [params, setParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") return new URLSearchParams(window.location.search);
    return new URLSearchParams();
  });

  const [items, setItems] = useState<SetsBundle[]>([]);
  const [nextURL, setNextURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    (async () => {
      // ✅ استفاده از کلاینت داخلی
      const path = buildApiPath(params, 1);
      const data = await get<ApiResponse>(path, {
        throwOnHTTP: false,
        fallback: { results: [], next: null },
        init: { signal: ctrl.signal },
      });

      setItems((data?.results ?? []).map(normalizeBundle));
      setNextURL(makeAbs(data?.next || null));
    })()
      .catch((e: any) => {
        if (e?.name !== "AbortError") setError(e?.message || "خطای نامشخص");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const loadMore = async () => {
    if (!nextURL) return;
    setLoadingMore(true);
    try {
      const data = await get<ApiResponse>(nextURL, {
        throwOnHTTP: false,
        fallback: { results: [], next: null },
      });
      setItems((prev) => prev.concat((data?.results ?? []).map(normalizeBundle)));
      setNextURL(makeAbs(data?.next || null));
    } catch (e: any) {
      setError(e?.message || "خطای نامشخص");
    } finally {
      setLoadingMore(false);
    }
  };

  const updateParam = (key: string, value?: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (value === undefined || value === null || value === "") p.delete(key);
    else p.set(key, value);
    setParams(p);
    if (typeof window !== "undefined") {
      const qs = p.toString();
      const u = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState({}, "", u);
    }
  };

  const q = params.get("q") || "";
  const sort = params.get("sort") || "newest";
  const minp = params.get("minp") || "";
  const maxp = params.get("maxp") || "";
  const size = params.get("size") || "";
  const age = params.get("age") || "";
  const season = params.get("season") || "";

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      {/* breadcrumb */}
      <nav className="text-sm text-slate-500 mb-4">
        <ol className="flex items-center gap-1">
          <li>
            <Link className="hover:text-slate-700" href="/">
              خانه
            </Link>
          </li>
          <li> / </li>
          <li className="text-slate-900 font-semibold">ست‌ها</li>
        </ol>
      </nav>

      {/* header + sort */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">ست‌های بچگانه</h1>
          <p className="text-sm text-slate-500 mt-1">
            مجموعه‌ای متنوع از ست‌های هماهنگ؛ فیلتر کن، مقایسه کن و راحت انتخاب کن.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">مرتب‌سازی:</label>
          <select
            className="rounded-xl border px-2 py-1 text-sm"
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
          >
            <option value="newest">جدیدترین</option>
            <option value="popular">محبوب‌ترین</option>
            <option value="price_low">ارزان‌تر</option>
            <option value="price_high">گران‌تر</option>
          </select>
        </div>
      </div>

      {/* filters */}
      <div className="mb-4 grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <input
            className="w-full rounded-2xl border px-4 py-2 text-sm"
            placeholder="جستجو در ست‌ها…"
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", (e.target as HTMLInputElement).value.trim());
              }
            }}
          />
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="حداقل قیمت"
            inputMode="numeric"
            defaultValue={minp}
            onBlur={(e) => updateParam("minp", (e.target as HTMLInputElement).value.trim())}
          />
          <span className="text-slate-400">—</span>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="حداکثر قیمت"
            inputMode="numeric"
            defaultValue={maxp}
            onBlur={(e) => updateParam("maxp", (e.target as HTMLInputElement).value.trim())}
          />
        </div>
        <div className="md:col-span-4 grid grid-cols-3 gap-2">
          <select
            className="rounded-xl border px-2 py-2 text-sm"
            value={size}
            onChange={(e) => updateParam("size", e.target.value || null)}
          >
            <option value="">سایز</option>
            <option value="3-4">۳–۴</option>
            <option value="5-6">۵–۶</option>
            <option value="7-8">۷–۸</option>
            <option value="9-10">۹–۱۰</option>
            <option value="11-12">۱۱–۱۲</option>
          </select>
          <select
            className="rounded-xl border px-2 py-2 text-sm"
            value={age}
            onChange={(e) => updateParam("age", e.target.value || null)}
          >
            <option value="">سن</option>
            <option value="baby">نوزاد</option>
            <option value="kid">کودک</option>
            <option value="teen">نوجوان</option>
          </select>
          <select
            className="rounded-xl border px-2 py-2 text-sm"
            value={season}
            onChange={(e) => updateParam("season", e.target.value || null)}
          >
            <option value="">فصل</option>
            <option value="spring_summer">بهار/تابستان</option>
            <option value="fall_winter">پاییز/زمستان</option>
            <option value="all">چهارفصل</option>
          </select>
        </div>
      </div>

      {/* list */}
      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onReset={() => setParams(new URLSearchParams())} />
      ) : (
        <>
          {/* لیست */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {items.map((b) => (
    <BundleCard
      key={b.id ?? b.slug}
      bundle={{
        title: b.title ?? "بدون عنوان",
        slug: b.slug,
        id: b.id,
        image:
          typeof b.image === "string"
            ? b.image
            : (b.image?.url || (b.image as any)?.image || (b.image as any)?.src) ?? null,

        // مهم: محصولات داخل باندل را پاس بده تا اگر قیمت مستقیم نبود، کارت جمع بزند
        products: b.products,

        // لیبل + هر نام رایج قیمت/تخفیف که API می‌فرستد
        label: (b as any).label ?? (Array.isArray(b.tags) ? b.tags[0] : null),

        price: (b as any).price,
        bundle_price: (b as any).bundle_price,
        final_price: (b as any).final_price,
        sale_price: (b as any).sale_price,
        discounted_price: (b as any).discounted_price,
        total_price: (b as any).total_price,

        price_before: (b as any).price_before,
        regular_price: (b as any).regular_price,

        price_min: b.price_min ?? (b as any).min_price,
        price_max: b.price_max ?? (b as any).max_price,
        min_price: (b as any).min_price,
        max_price: (b as any).max_price,

        discount_percent:
          (b as any).discount_percent ??
          (b as any).off_percent ??
          (b as any).discount ??
          null,
      }}
    />
  ))}
</div>



          <div className="mt-6 flex justify-center">
            {nextURL ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className={classNames(
                  "px-4 py-2 rounded-xl text-sm font-bold shadow",
                  "bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
                )}
              >
                {loadingMore ? "در حال بارگذاری…" : "نمایش موارد بیشتر"}
              </button>
            ) : (
              <span className="text-xs text-slate-400">همهٔ نتایج نمایش داده شد.</span>
            )}
          </div>
        </>
      )}
    </main>
  );
}

// ——— UI bits ———
function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-64 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
        >
          <div className="h-40 bg-slate-100 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-2/3 bg-slate-100 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-slate-100 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}


function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow">
      <div className="text-2xl">😕</div>
      <h3 className="mt-2 text-lg font-bold text-slate-900">همچین موردی پیدا نکردیم</h3>
      <p className="mt-1 text-sm text-slate-500">
        فیلترها را ساده‌تر کن یا جستجو را تغییر بده؛ یا همه‌چیز را از اول ببین.
      </p>
      <div className="mt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          بازنشانی فیلترها
        </button>
      </div>
    </div>
  );
}
