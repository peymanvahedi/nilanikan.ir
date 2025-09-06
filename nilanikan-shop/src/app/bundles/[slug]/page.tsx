// src/app/bundles/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { get, endpoints } from "@/lib/api";
import { addManyToCart } from "@/lib/cart";

/* ---------- helpers ---------- */
const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && (window as any).__NEXT_PUBLIC_API_URL__) ||
  "http://localhost:8000";

// Placeholder بدون نیاز به فایل public
const FALLBACK_IMG: string =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
      <rect width='100%' height='100%' fill='#f1f5f9'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-family='sans-serif' font-size='14' fill='#94a3b8'>No Image</text>
    </svg>`
  );

/** Normalize image URL (خروجی همیشه string | null است) */
const toAbs = (u?: string | null): string | null => {
  if (!u) return null;
  const s = String(u).trim();

  // اگر URL مطلق است و داخلش /media/... دارد → به مسیر نسبی تبدیل کن
  const m = s.match(/^https?:\/\/[^/]+(\/media\/.+)$/i);
  if (m?.[1]) return m[1];

  // خودِ مسیر مدیا و نسبی
  if (s.startsWith("/media/")) return s;

  // مطلق یا data:
  if (/^https?:|^data:/i.test(s)) return s;

  // سایر نسبی‌ها را مطلق کن
  return `${API_BASE}${s.startsWith("/") ? s : `/${s}`}`;
};

function toNumberSafe(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const num = Number(v.replace?.(/[,٬\s]/g, ""));
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

/* ---------- انتخاب امن تصویر (با جست‌وجوی بازگشتی) ---------- */
function pickImage(node: any): string | null {
  const KEYS = [
    "image","thumbnail","photo","picture","cover_image","cover",
    "image_url","main_image","src","url","file","path"
  ];
  const ARR_KEYS = ["images","photos","gallery","thumbnails","media"];

  const readDirect = (obj: any): string | null => {
    if (!obj) return null;
    for (const k of KEYS) {
      const v = obj?.[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    for (const k of ARR_KEYS) {
      const arr = obj?.[k];
      if (Array.isArray(arr)) {
        for (const it of arr) {
          if (typeof it === "string" && it.trim()) return it;
          if (typeof it === "object" && it) {
            for (const kk of KEYS) {
              const v = it?.[kk];
              if (typeof v === "string" && v.trim()) return v;
            }
          }
        }
      }
    }
    return null;
  };

  // 🔎 جست‌وجوی بازگشتی: هر رشته‌ای که بوی عکس بده (media/ یا پسوند تصویری)
  const findMediaUrl = (obj: any, depth = 0): string | null => {
    if (!obj || depth > 3) return null;
    if (typeof obj === "string") {
      const s = obj.trim();
      if (!s) return null;
      if (s.includes("/media/") || /\.(jpe?g|png|webp|gif|svg)(\?|#|$)/i.test(s)) return s;
      return null;
    }
    if (Array.isArray(obj)) {
      for (const it of obj) {
        const r = findMediaUrl(it, depth + 1);
        if (r) return r;
      }
      return null;
    }
    if (typeof obj === "object") {
      for (const val of Object.values(obj)) {
        const r = findMediaUrl(val, depth + 1);
        if (r) return r;
      }
    }
    return null;
  };

  // از سطح آیتم و محصول بخوان
  const direct =
    readDirect(node) ??
    readDirect(node?.product) ??
    null;

  const fallback =
    direct ??
    findMediaUrl(node) ??
    findMediaUrl(node?.product) ??
    null;

  return fallback ? (toAbs(fallback) ?? null) : null;
}


type BundleProduct = {
  id: number;
  slug?: string | null;
  name: string;
  image: string | null;
  price: number;
};
type Bundle = {
  id: number;
  slug?: string | null;
  title: string;
  image: string | null;
  price: number;
  items: BundleProduct[];
};

function normalizeProduct(p: any): BundleProduct {
  const base = p ?? {};
  const prod = p?.product ?? {};

  // مرجِ امن: اول فیلدهای آیتم، بعد محصول (در جاهایی که آیتم خالیه)
  const node = { ...base, ...prod };

  const id =
    Number(base?.id ?? base?.product_id ?? prod?.id ?? base?.pk ?? prod?.pk ?? 0) || 0;

  const slug = base?.slug ?? prod?.slug ?? null;

  const name =
    base?.name ?? base?.title ?? prod?.name ?? prod?.title ?? (id ? `محصول ${id}` : "محصول");

  const price = toNumberSafe(
    base?.final_price ??
      base?.discount_price ??
      base?.selling_price ??
      base?.unit_price ??
      base?.price ??
      prod?.final_price ??
      prod?.discount_price ??
      prod?.selling_price ??
      prod?.unit_price ??
      prod?.price ??
      0
  );

  const image = pickImage(node);

  return { id, slug, name: String(name), image, price };
}

function normalizeBundle(b: any): Bundle {
  const itemsRaw: any[] =
    (Array.isArray(b?.items) && b.items) ||
    (Array.isArray(b?.products) && b.products) ||
    (Array.isArray(b?.bundle_items) && b.bundle_items) ||
    (Array.isArray(b?.items_list) && b.items_list) ||
    [];
  const items = itemsRaw.map(normalizeProduct).filter((x) => x.id);

  const id = Number(b?.id ?? b?.pk ?? 0) || 0;
  const slug = b?.slug ?? null;
  const title = String(b?.title ?? b?.name ?? (id ? `باندل ${id}` : "باندل"));
  const bundleImage =
    toAbs(b?.image ?? b?.thumbnail ?? b?.images?.[0]) || items[0]?.image || null;

  const rawPrice = toNumberSafe(
    b?.final_price ?? b?.discount_price ?? b?.selling_price ?? b?.price ?? 0
  );
  const price = rawPrice > 0 ? rawPrice : items.reduce((s, i) => s + (i.price || 0), 0);

  return { id, slug, title, image: bundleImage, price, items };
}

/* ---------- Page ---------- */
export default function BundlePage() {
  const { slug } = useParams<{ slug: string }>();

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // انتخاب‌ها
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // گالری
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // مشابه
  const [related, setRelated] = useState<Bundle[]>([]);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // فرمت قیمت
  const nf = useMemo(() => new Intl.NumberFormat("fa-IR"), []);
  const fmt = (n: number) => nf.format(Math.round(n));

  const selectedItems = useMemo(
    () => (bundle ? bundle.items.filter((i) => selectedIds.has(i.id)) : []),
    [bundle, selectedIds]
  );
  const displayPrice = useMemo(() => {
    if (!bundle) return 0;
    if (selectedIds.size === 0) return bundle.price;
    return selectedItems.reduce((s, i) => s + (i.price || 0), 0);
  }, [bundle, selectedItems, selectedIds]);

  const mainImage = useMemo(() => {
    if (activeImage) return activeImage;
    if (selectedItems.length === 1) return selectedItems[0]?.image ?? bundle?.image ?? FALLBACK_IMG;
    return bundle?.image ?? FALLBACK_IMG;
  }, [activeImage, selectedItems, bundle]);

  const galleryThumbs = useMemo(() => {
    const s = new Set<string>();
    if (bundle?.image) s.add(bundle.image);
    for (const it of bundle?.items ?? []) {
      if (it.image) s.add(it.image);
      if (s.size >= 8) break;
    }
    const arr = Array.from(s);
    if (!arr.length) arr.push(FALLBACK_IMG);
    return arr;
  }, [bundle]);

  // لود باندل
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        let data: any = null;
        try {
          data = await get(`${endpoints.bundles}${encodeURIComponent(slug)}/`, {
            cache: "no-store",
          } as any);
        } catch {}
        if (!data) {
          const list = await get(
            `${endpoints.bundles}?search=${encodeURIComponent(slug)}`,
            { cache: "no-store" } as any
          );
          data = Array.isArray(list?.results)
            ? list.results[0]
            : Array.isArray(list)
            ? list[0]
            : list;
        }
        if (!data) throw new Error("باندل پیدا نشد");

        if (!aborted) {
          const normalized = normalizeBundle(data);
          setBundle(normalized);
          setSelectedIds(new Set());
          setActiveImage(null);
        }
      } catch (e: any) {
        if (!aborted) setErr(e?.message || "خطا در دریافت اطلاعات باندل");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [slug]);

  // مشابه (فقط عنوان شامل «ست»)
  useEffect(() => {
    if (!bundle) return;
    const hasSet = (s?: string | null) => typeof s === "string" && s.includes("ست");
    (async () => {
      try {
        const res = await get(`${endpoints.bundles}?search=${encodeURIComponent("ست")}&limit=30`, {
          cache: "no-store",
        } as any);
        const rows: any[] = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
        const list = rows
          .map(normalizeBundle)
          .filter((b) => b.id && hasSet(b.title) && b.id !== bundle.id)
          .slice(0, 20);
        setRelated(list);
      } catch {
        setRelated([]);
      }
    })();
  }, [bundle]);

  // selection handlers
  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll = () => bundle && setSelectedIds(new Set(bundle.items.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // cart
  const addSelectedToCart = async () => {
    const items = selectedItems.length ? selectedItems : bundle?.items || [];
    if (items.length === 0) return;
    await addManyToCart(
      items.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        image: it.image ?? null,
      })),
      1
    );
    alert(
      selectedItems.length
        ? `${selectedItems.length} آیتم انتخابی به سبد اضافه شد.`
        : "تمام آیتم‌های باندل به سبد اضافه شد."
    );
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6" dir="rtl">
        <div className="h-8 w-36 rounded-full bg-slate-200 animate-pulse mb-4" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5">
            <div className="aspect-square sm:aspect-[4/3] rounded-3xl bg-slate-200 animate-pulse" />
            <div className="mt-3 grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 space-y-3">
            <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-60 rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (err) return <div className="p-6 text-red-600" dir="rtl">{err}</div>;
  if (!bundle) return <div className="p-6" dir="rtl">چیزی پیدا نشد.</div>;

  const hero = mainImage || FALLBACK_IMG;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
      {/* Breadcrumb */}
      <nav className="mb-3 text-sm text-slate-500">
        <a href="/" className="hover:text-slate-700">خانه</a>
        <span className="mx-1.5">/</span>
        <a href="/bundles" className="hover:text-slate-700">باندل‌ها</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-800">{bundle.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{bundle.title}</h1>
        <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          پکیج ویژه
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Gallery */}
        <section className="col-span-12 lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-square sm:aspect-[4/3]">
              <Image
                src={hero}
                alt={bundle.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
                className="object-contain transition duration-300 hover:scale-[1.02] bg-white"
                unoptimized
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 to-transparent" />
            </div>
          </div>

          {/* Thumbs */}
          <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto">
            {galleryThumbs.map((src, idx) => {
              const active = hero === src;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImage(src)}
                  className={[
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition",
                    active ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-slate-200 hover:shadow-sm",
                  ].join(" ")}
                  aria-label={`تصویر ${idx + 1}`}
                >
                  <Image
                    src={src || FALLBACK_IMG}
                    alt={`thumb-${idx}`}
                    fill
                    sizes="80px"
                    className="object-contain bg-white"
                    unoptimized
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Summary & CTA */}
        <section className="col-span-12 lg:col-span-7 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 sm:p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">
                  {selectedIds.size ? "مجموع آیتم‌های انتخاب‌شده" : "قیمت باندل"}
                </div>
                <div className="mt-1 inline-flex items-baseline gap-1 rounded-2xl bg-emerald-50 px-4 py-1.5 ring-1 ring-emerald-100">
                  <span className="text-3xl font-black text-emerald-700 leading-none">
                    {fmt(displayPrice)}
                  </span>
                  <span className="text-[12px] font-semibold text-emerald-700">تومان</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={addSelectedToCart}
                  className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {selectedIds.size ? "افزودن آیتم‌های انتخابی" : "افزودن تمام باندل"}
                </button>
                <a
                  href="#bundle-items"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  مشاهده آیتم‌ها
                </a>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-6 text-slate-500">
              از لیست زیر آیتم‌ها را انتخاب/لغو کنید. اگر انتخابی انجام نشود، همهٔ آیتم‌ها افزوده می‌شوند.
            </p>
          </div>

          {/* Selectable items */}
          <div id="bundle-items" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">آیتم‌های داخل باندل</h2>
              <span className="ml-auto text-xs text-slate-500">
                {selectedIds.size ? `${selectedIds.size} انتخاب` : "بدون انتخاب"}
              </span>
              <button onClick={selectAll} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                انتخاب همه
              </button>
              <button onClick={clearSelection} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                پاک‌کردن
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {bundle.items.map((it) => {
                const checked = selectedIds.has(it.id);
                return (
                  <label
                    key={it.id}
                    className={[
                      "group relative flex cursor-pointer flex-col rounded-2xl border bg-white p-2 transition",
                      checked ? "border-emerald-500/70 ring-2 ring-emerald-500/30" : "border-slate-200 hover:shadow-sm",
                    ].join(" ")}
                    title={it.name}
                  >
                    <input
                      type="checkbox"
                      className="peer absolute right-2 top-2 h-4 w-4 cursor-pointer accent-emerald-600"
                      checked={checked}
                      onChange={() => toggleSelect(it.id)}
                    />
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50">
                      <Image
                        src={it.image || FALLBACK_IMG}
                        alt={it.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition group-hover:scale-[1.02]"
                        onMouseEnter={() => setActiveImage(it.image ?? null)}
                        onMouseLeave={() => setActiveImage(null)}
                        unoptimized
                      />
                    </div>
                    <div className="mt-2 line-clamp-1 text-[13px] font-medium text-slate-800">{it.name}</div>
                    <div className="text-[12px] font-semibold text-emerald-600">
                      {fmt(it.price)} <span className="font-normal">تومان</span>
                    </div>
                    <span
                      className={[
                        "absolute -top-1 -left-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        checked ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">باندل‌های مشابه</h3>
                <div className="hidden sm:flex gap-2">
                  <button
                    onClick={() => sliderRef.current?.scrollBy({ left: -600, behavior: "smooth" })}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => sliderRef.current?.scrollBy({ left: +600, behavior: "smooth" })}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div
                ref={sliderRef}
                className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pr-1"
              >
                {related.map((b) => (
                  <a
                    key={`rb-${b.id}-${b.title}`}
                    href={`/bundles/${b.slug ?? b.id}`}
                    className="snap-start shrink-0 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md transition"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50">
                      <Image
                        src={b.image || FALLBACK_IMG}
                        alt={b.title}
                        fill
                        sizes="176px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="mt-2 line-clamp-1 text-sm font-medium text-slate-800">{b.title}</div>
                    <div className="text-[13px] font-semibold text-emerald-600">
                      {fmt(b.price)} <span className="font-normal">تومان</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sticky bottom bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 px-4 py-3 sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">
              {selectedIds.size ? "مجموع انتخاب شما" : "قیمت باندل"}
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              {fmt(displayPrice)} <span className="text-xs font-semibold">تومان</span>
            </span>
          </div>
          <button
            onClick={addSelectedToCart}
            className="ml-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            افزودن به سبد
          </button>
        </div>
      </div>

      {/* global */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
