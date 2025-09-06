// src/app/bundle/[slug]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductTabs from "@/components/ProductTabs";
import { get, endpoints, toApi, absolutizeMedia } from "@/lib/api";

/* ---------- Types ---------- */
type SizeChart = {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
};

type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  discount_price?: number | null;
  brand?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[];
  gallery?: { id: number; image: string; alt?: string | null }[];
  attributes?: Record<string, string | string[] | number | boolean>;
  size_chart?: SizeChart | null;
  category?: string | number | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  [k: string]: any;
};

type BundleItem = {
  product: Product;
  quantity?: number;
};

type Bundle = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  price: number; // قیمت نهایی باندل
  compare_at_price?: number | null; // جمع تکی‌ها یا قیمت بدون تخفیف
  discount_price?: number | null; // اگر API به همین شکل می‌دهد
  image?: string | null;
  images?: string[];
  gallery?: { id: number; image: string; alt?: string | null }[];
  items?: BundleItem[];
  attributes?: Record<string, string | string[] | number | boolean>;
  size_chart?: SizeChart | null;
  brand?: string | null;
  category?: string | number | null;
  category_slug?: string | null;
  [k: string]: any;
};

/* ---------- Utils ---------- */
function resolveImage(src?: string | null, seed?: string) {
  const abs = absolutizeMedia(src || undefined);
  if (abs) return abs;
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "bundle")}/1200/1200`;
}
function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}
function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function toDescriptionHtml(desc?: string | null): string {
  if (!desc) return "";
  const parts = desc.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

/* ---------- Gallery (Mobile / Desktop) ---------- */
function MobileGallery({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className="lg:hidden">
      <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-2 [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 snap-center w-[80%] sm:w-[45%] aspect-[4/5] rounded-xl ring-1 ring-zinc-200 overflow-hidden"
          >
            <Image src={src || "/placeholder.png"} alt={alt} fill className="object-cover" sizes="80vw" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopGallery({
  images,
  alt,
  active,
  setActive,
}: {
  images: string[];
  alt: string;
  active: number;
  setActive: (i: number) => void;
}) {
  const main = images[active] || images[0] || "/placeholder.png";
  return (
    <div className="hidden lg:grid grid-cols-[80px_1fr] gap-4">
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-1">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-20 w-16 rounded-lg overflow-hidden ring-1 ${
              active === i ? "ring-2 ring-pink-600" : "ring-zinc-200"
            }`}
            aria-label={`تصویر ${i + 1}`}
          >
            <Image src={src || "/placeholder.png"} alt={alt} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] w-full rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
        <Image src={main || "/placeholder.png"} alt={alt} fill className="object-cover" sizes="420px" priority />
      </div>
    </div>
  );
}

/* ---------- Related bundles (horizontal) ---------- */
function RelatedBundles({ items }: { items: Bundle[] }) {
  if (!items?.length) return null;
  return (
    <div className="relative">
      <div className="mt-4 flex overflow-x-auto gap-3 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden">
        {items.map((b) => {
          const img =
            (Array.isArray(b.images) && b.images[0]) ||
            (Array.isArray(b.gallery) && (b.gallery as any[])[0]?.image) ||
            b.image ||
            "/placeholder.png";
          const src = resolveImage(img, b.slug || String(b.id));

          const base = Number(b.compare_at_price ?? 0) || 0;
          const final = Number(b.discount_price ?? b.price);
          const hasOff = base > 0 && final < base;
          const off = hasOff ? Math.round((1 - final / base) * 100) : 0;

          return (
            <Link
              key={b.slug ?? b.id}
              href={`/bundle/${b.slug ?? b.id}`}
              className="snap-center relative flex-shrink-0 w=[68%] sm:w-[40%] lg:w-[22%] rounded-2xl border border-zinc-200 bg-white p-3 hover:shadow-sm transition"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl ring-1 ring-zinc-100">
                <Image src={src || "/placeholder.png"} alt={b.name} fill className="object-cover" sizes="(min-width:1024px) 240px, 70vw" />
              </div>
              <div className="mt-3 space-y-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">{b.name}</h3>
                <div className="flex items-end gap-2">
                  {hasOff && (
                    <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                      {toFa(off)}٪
                    </span>
                  )}
                  {hasOff && <del className="text-xs text-zinc-400">{toFa(base)}</del>}
                </div>
                <div className="text-pink-600 font-extrabold">
                  {toFa(final)} <span className="text-[11px] mr-1">تومان</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function BundlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const [related, setRelated] = useState<Bundle[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // endpoints.bundles باید در src/lib/api تعریف شده باشد (هست).
  const bundlesEndpoint = endpoints.bundles;

  // fetch bundle
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const url = toApi(`${bundlesEndpoint}${slug}/`);
        const data = await get<Bundle>(url, { init: { cache: "no-store", next: { revalidate: 0 } as any } } as any);
        if (!alive) return;
        setBundle(data);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "خطا در دریافت اطلاعات باندل");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, bundlesEndpoint]);

  // fetch related bundles (by category if available)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!bundle) return;
      setRelatedLoading(true);
      try {
        let url = `${bundlesEndpoint}?limit=16`;
        const cat =
          bundle.category_slug ??
          (typeof bundle.category === "string" ? bundle.category : undefined);
        if (cat) url += `&category=${encodeURIComponent(cat)}`;
        if (bundle.id != null) url += `&exclude=${bundle.id}`;

        const list = await get<any>(toApi(url), { init: { cache: "no-store" } } as any);
        if (!alive) return;

        const items: Bundle[] = Array.isArray(list?.results)
          ? list.results
          : Array.isArray(list)
          ? list
          : [];
        setRelated(items.filter((b) => (b.slug ?? b.id) !== (bundle.slug ?? bundle.id)));
      } catch {
        setRelated([]);
      } finally {
        if (alive) setRelatedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bundle?.id, bundle?.slug, bundle?.category, bundle?.category_slug, bundlesEndpoint]);

  const descriptionHtml = useMemo(() => {
    const raw = bundle?.description ?? "";
    const looksLikeHtml = /<\w+[^>]*>/.test(raw);
    return looksLikeHtml ? raw : toDescriptionHtml(raw);
  }, [bundle?.description]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        در حال بارگذاری…
      </main>
    );
  }
  if (err || !bundle) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        خطا: {err || "باندل پیدا نشد."}
      </main>
    );
  }

  // gallery list
  const galleryRaw: string[] = [
    ...(Array.isArray(bundle.images) ? bundle.images : []),
    ...(Array.isArray(bundle.gallery) ? bundle.gallery.map((g) => g.image) : []),
    ...(bundle.image ? [bundle.image] : []),
  ];
  const images: string[] = galleryRaw.map((g, i) => resolveImage(g, bundle.slug + "_" + i));

  const basePrice = Number(bundle.compare_at_price ?? 0) || 0;
  const finalPrice = Number(bundle.discount_price ?? bundle.price);
  const hasDiscount = basePrice > 0 && finalPrice < basePrice;
  const discount = hasDiscount ? Math.round((1 - finalPrice / basePrice) * 100) : 0;

  // محاسبه جمع آیتم‌ها (اگر API compare_at_price ندهد)
  const itemsTotal = useMemo(() => {
    const arr = bundle.items ?? [];
    return arr.reduce((sum, it) => {
      const p = Number(it.product?.discount_price ?? it.product?.price ?? 0);
      const q = Number(it.quantity ?? 1);
      return sum + p * q;
    }, 0);
  }, [bundle.items]);

  const features = useMemo<string[]>(() => {
    const out: string[] = [];
    if (Array.isArray(bundle.items)) {
      out.push(`تعداد آیتم‌ها: ${bundle.items.length}`);
    }
    if (hasDiscount) out.push(`صرفه‌جویی: ${toFa(basePrice - finalPrice)} تومان (${toFa(discount)}٪)`);
    return out;
  }, [bundle.items, hasDiscount, basePrice, finalPrice, discount]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      {/* breadcrumbs */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>باندل‌ها</span> <span>›</span>
        <span className="font-medium text-zinc-700">{bundle.name}</span>
      </nav>

      {/* 3 columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr_360px] lg:items-start">
        {/* Gallery */}
        <section className="lg:col-start-1 lg:col-end-2">
          <MobileGallery images={images} alt={bundle.name} />
          <DesktopGallery images={images} alt={bundle.name} active={active} setActive={setActive} />
        </section>

        {/* Details */}
        <section className="lg:col-start-2 lg:col-end-3">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-zinc-900">{bundle.name}</h1>

          {/* آیتم‌های داخل باندل */}
          {Array.isArray(bundle.items) && bundle.items.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-sm font-bold text-zinc-900">محتویات باندل</h2>
              <ul className="space-y-3">
                {bundle.items.map((it, i) => {
                  const p = it.product;
                  const q = Number(it.quantity ?? 1);
                  const img =
                    (Array.isArray(p.images) && p.images[0]) ||
                    (Array.isArray(p.gallery) && (p.gallery as any[])[0]?.image) ||
                    p.image ||
                    "/placeholder.png";
                  const src = resolveImage(img, p.slug || String(p.id));

                  const priceEach = Number(p.discount_price ?? p.price ?? 0);
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="relative h-16 w-12 overflow-hidden rounded-md ring-1 ring-zinc-200">
                        <Image src={src} alt={p.name} fill className="object-cover" sizes="48px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${p.slug ?? p.id}`} className="block truncate text-sm font-semibold hover:underline">
                          {p.name}
                        </Link>
                        <div className="text-xs text-zinc-500 mt-0.5">تعداد: {toFa(q)}</div>
                      </div>
                      <div className="text-xs whitespace-nowrap">
                        {toFa(priceEach)} <span>تومان</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* جمع تکی‌ها اگر compare_at_price نداشت */}
              {!basePrice && itemsTotal > 0 && (
                <div className="text-xs text-zinc-500">
                  جمع قیمت آیتم‌ها (تکی): <span className="font-bold">{toFa(itemsTotal)}</span> تومان
                </div>
              )}
            </div>
          )}

          {/* ویژگی‌ها/هایلایت‌ها */}
          {features.length > 0 && (
            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              {features.slice(0, 6).map((f, i) => (
                <li key={i}>
                  <span className="text-emerald-600">•</span> {f}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Buy box */}
        <aside className="lg:col-start-3 lg:col-end-4">
          <div className="sticky top-4 rounded-2xl border border-zinc-200 p-4 bg-white">
            <ul className="mb-4 space-y-3 text-sm text-zinc-700">
              <li>🛡️ ضمانت اصالت و سلامت کالا</li>
              <li>🔄 بازگشت ۷ روزه طبق شرایط</li>
              <li>🚚 ارسال رایگان خریدهای بالای ۲.۵ میلیون</li>
            </ul>
            <div className="text-center">
              <div className="mb-1 flex items-end justify-center gap-3">
                {hasDiscount && (
                  <span className="rounded-lg bg-rose-600 px-2 py-0.5 text-xs font-extrabold text-white">
                    {toFa(discount)}٪
                  </span>
                )}
                {hasDiscount && basePrice > 0 && (
                  <del className="text-sm text-zinc-400">{toFa(basePrice)}</del>
                )}
              </div>
              <div className="text-2xl font-extrabold text-pink-600">
                {toFa(finalPrice)} <span className="text-sm">تومان</span>
              </div>
            </div>
            <div className="mt-4">
              <AddToCartButton
                id={Number(bundle.id)}
                price={finalPrice}
                name={bundle.name}
                image={images[0] || "/placeholder.png"}
                className="h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700"
              />
            </div>

            {/* توضیح کوتاه صرفه‌جویی */}
            {hasDiscount && basePrice > 0 && (
              <p className="mt-3 text-center text-xs text-emerald-600">
                با خرید این باندل {toFa(basePrice - finalPrice)} تومان صرفه‌جویی می‌کنید
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <section className="mt-12">
        <ProductTabs
          features={features}
          description={descriptionHtml}
          sizeChart={undefined}
          reviewsEnabled={false}
          initialTab="features"
        />
      </section>

      {/* Related */}
      {(relatedLoading || related.length > 0) && (
        <section className="mt-14">
          <h2 className="mb-4 text-base md:text-lg font-bold text-zinc-900">باندل‌های مشابه</h2>

          {relatedLoading && <p className="text-sm text-zinc-500">در حال بارگذاری…</p>}

          {!relatedLoading && related.length > 0 && <RelatedBundles items={related} />}
        </section>
      )}
    </main>
  );
}
