"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { get, endpoints } from "@/lib/api";
import ProductTabs from "@/components/ProductTabs";

// ---- Types ----
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

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---- Utils ----
function resolveImage(src?: string | null, seed?: string) {
  if (!src) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed || "prod")}/1200/1200`;
  }
  return src?.startsWith("http") ? src : `${BASE}${src}`;
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

// ---- Mobile Gallery (one + half) ----
function MobileGallery({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className="lg:hidden">
      <div
        className="
          flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-2
          [&::-webkit-scrollbar]:hidden
        "
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="
              relative flex-shrink-0 snap-center 
              w-[80%] sm:w-[45%] 
              aspect-[4/5] rounded-xl ring-1 ring-zinc-200 overflow-hidden
            "
          >
            <Image
              src={src || "/placeholder.png"}
              alt={alt}
              fill
              className="object-cover"
              sizes="80vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Desktop Gallery (thumbnails + main) ----
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
            <Image
              src={src || "/placeholder.png"}
              alt={alt}
              fill
              className="object-cover"
              sizes="64px"
            />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] w-full rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
        <Image
          src={main || "/placeholder.png"}
          alt={alt}
          fill
          className="object-cover"
          sizes="420px"
          priority
        />
      </div>
    </div>
  );
}

// ---- Related products horizontal slider ----
function RelatedSlider({ items }: { items: Product[] }) {
  if (!items?.length) return null;
  return (
    <div className="relative">
      <div
        className="
          mt-4 flex overflow-x-auto gap-3 snap-x snap-mandatory scroll-smooth
          [&::-webkit-scrollbar]:hidden
        "
      >
        {items.map((p) => {
          const img =
            (Array.isArray(p.images) && p.images[0]) ||
            (Array.isArray(p.gallery) && (p.gallery as any[])[0]?.image) ||
            p.image ||
            "/placeholder.png";
          const src = resolveImage(img, p.slug || String(p.id));
          const hasOff = !!p.discount_price && Number(p.discount_price) < Number(p.price);
          const off =
            hasOff && p.discount_price
              ? Math.round((1 - Number(p.discount_price) / Number(p.price)) * 100)
              : 0;

          return (
            <Link
              key={p.slug ?? p.id}
              href={`/product/${p.slug ?? p.id}`}
              className="
                snap-center relative flex-shrink-0 w-[68%] sm:w-[40%] lg:w-[22%]
                rounded-2xl border border-zinc-200 bg-white p-3 hover:shadow-sm transition
              "
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl ring-1 ring-zinc-100">
                <Image
                  src={src || "/placeholder.png"}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px) 240px, 70vw"
                />
              </div>
              <div className="mt-3 space-y-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">{p.name}</h3>
                <div className="flex items-end gap-2">
                  {hasOff && (
                    <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                      {toFa(off)}٪
                    </span>
                  )}
                  {hasOff && <del className="text-xs text-zinc-400">{toFa(Number(p.price))}</del>}
                </div>
                <div className="text-pink-600 font-extrabold">
                  {toFa(Number(p.discount_price ?? p.price))}
                  <span className="text-[11px] mr-1">تومان</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ---- Page ----
export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const [related, setRelated] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // fetch product
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await get(`${endpoints.products}${slug}/`, { cache: "no-store" } as any);
        if (!alive) return;
        setProduct(data as Product);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "خطا در دریافت اطلاعات محصول");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // fetch related by category (fallback: brand)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!product) return;
      setRelatedLoading(true);
      try {
        const catCandidate =
          product.category_slug ||
          product.categorySlug ||
          product.category_name ||
          product.categoryName ||
          (typeof product.category === "string" ? product.category : undefined);

        const catId = typeof product.category === "number" ? product.category : undefined;

        let url = `${endpoints.products}?limit=16`;
        if (catCandidate) url += `&category=${encodeURIComponent(catCandidate)}`;
        else if (catId != null) url += `&category_id=${catId}`;
        else if (product.brand) url += `&brand=${encodeURIComponent(product.brand)}`;
        if (product.id != null) url += `&exclude=${product.id}`;

        const list = await get(url, { cache: "no-store" } as any);
        if (!alive) return;

        const items: Product[] = Array.isArray(list?.results)
          ? list.results
          : Array.isArray(list)
          ? list
          : [];
        setRelated(items.filter((p) => (p.slug ?? p.id) !== (product.slug ?? product.id)));
      } catch {
        setRelated([]);
      } finally {
        if (alive) setRelatedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [product?.id, product?.slug, product?.brand, product?.category, product?.category_slug, product?.categorySlug, product?.category_name, product?.categoryName]);

  const attrs = product?.attributes ?? {};
  const featureList = useMemo<string[]>(() => {
    const out: string[] = [];
    for (const [k, v] of Object.entries(attrs)) {
      if (Array.isArray(v)) out.push(`${k}: ${v.join("، ")}`);
      else if (typeof v === "boolean") out.push(`${k}: ${v ? "بله" : "خیر"}`);
      else out.push(`${k}: ${String(v)}`);
    }
    return out;
  }, [attrs]);

  const descriptionHtml = useMemo(() => {
    const raw = product?.description ?? "";
    const looksLikeHtml = /<\w+[^>]*>/.test(raw);
    return looksLikeHtml ? raw : toDescriptionHtml(raw);
  }, [product?.description]);

  const sizeChart: SizeChart | undefined = useMemo(() => {
    const sc = product?.size_chart;
    if (sc && sc.headers && sc.rows) return sc;
    return undefined;
  }, [product?.size_chart]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        در حال بارگذاری…
      </main>
    );
  }
  if (err || !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        خطا: {err || "محصول پیدا نشد."}
      </main>
    );
  }

  // gallery list
  const galleryRaw: string[] = [
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.gallery) ? product.gallery.map((g) => g.image) : []),
    ...(product.image ? [product.image] : []),
  ];
  const images: string[] = galleryRaw.map((g, i) => resolveImage(g, product.slug + "_" + i));

  const hasDiscount = !!product.discount_price && Number(product.discount_price) < Number(product.price);
  const discount =
    hasDiscount && product.discount_price
      ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      {/* breadcrumbs */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>محصولات</span> <span>›</span>
        <span className="font-medium text-zinc-700">{product.name}</span>
      </nav>

      {/* 3 columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr_360px] lg:items-start">
        {/* Gallery */}
        <section className="lg:col-start-1 lg:col-end-2">
          <MobileGallery images={images} alt={product.name} />
          <DesktopGallery images={images} alt={product.name} active={active} setActive={setActive} />
        </section>

        {/* Details */}
        <section className="lg:col-start-2 lg:col-end-3">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-zinc-900">{product.name}</h1>
          {product.brand && <div className="mt-2 text-sm text-zinc-500">{product.brand}</div>}

          {featureList.length > 0 && (
            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              {featureList.slice(0, 4).map((f, i) => (
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
                {hasDiscount && <del className="text-sm text-zinc-400">{toFa(Number(product.price))}</del>}
              </div>
              <div className="text-2xl font-extrabold text-pink-600">
                {toFa(Number(product.discount_price ?? product.price))} <span className="text-sm">تومان</span>
              </div>
            </div>
            <div className="mt-4">
              <AddToCartButton
                id={Number(product.id)}
                price={Number(product.discount_price ?? product.price)}
                name={product.name}
                image={images[0] || "/placeholder.png"}
                className="h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <section className="mt-12">
        <ProductTabs
          features={featureList}
          description={descriptionHtml}
          sizeChart={sizeChart}
          reviewsEnabled={false}
          initialTab="features"
        />
      </section>

      {/* Related */}
      {(relatedLoading || related.length > 0) && (
        <section className="mt-14">
          <h2 className="mb-4 text-base md:text-lg font-bold text-zinc-900">محصولات مشابه</h2>

          {relatedLoading && <p className="text-sm text-zinc-500">در حال بارگذاری…</p>}

          {!relatedLoading && related.length > 0 && <RelatedSlider items={related} />}
        </section>
      )}
    </main>
  );
}
