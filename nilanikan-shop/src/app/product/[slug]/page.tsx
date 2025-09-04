"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { get, endpoints } from "@/lib/api";
import ProductTabs from "@/components/ProductTabs";

// ---- انواع (Types) ----
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
  gallery?: string[];
  attributes?: Record<string, string | string[] | number | boolean>;
  size_chart?: SizeChart | null;
  // فیلدهای احتمالی دسته‌بندی
  category?: string | number | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  [k: string]: any;
};

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---- Utilities ----
function resolveImage(src?: string | null, seed?: string) {
  if (!src)
    return `https://picsum.photos/seed/${encodeURIComponent(
      seed || "prod"
    )}/1200/1200`;
  return src.startsWith("http") ? src : `${BASE}${src}`;
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

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  // محصولات مشابه
  const [related, setRelated] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // واکشی محصول
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
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

  // ---- مشتق‌ها (قبل از هر return شرطی) ----
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

  // محصولات مشابه
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!product) return;
      setRelatedLoading(true);
      try {
        const catCandidate =
          (product.category_slug ||
            product.categorySlug ||
            product.category_name ||
            product.categoryName ||
            (typeof product.category === "string" ? product.category : undefined)) ?? undefined;

        const catId = typeof product.category === "number" ? product.category : undefined;

        let url = `${endpoints.products}?limit=8`;
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

        if ((!items || items.length === 0) && product.brand) {
          const url2 = `${endpoints.products}?limit=8&brand=${encodeURIComponent(
            product.brand
          )}&exclude=${product.id}`;
          const list2 = await get(url2, { cache: "no-store" } as any);
          const items2: Product[] = Array.isArray(list2?.results)
            ? list2.results
            : Array.isArray(list2)
            ? list2
            : [];
          setRelated(items2.filter((p) => p.slug !== product.slug));
        } else {
          setRelated(items.filter((p) => p.slug !== product.slug));
        }
      } catch {
        setRelated([]);
      } finally {
        if (alive) setRelatedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    product?.id,
    product?.slug,
    product?.brand,
    product?.category,
    product?.category_slug,
    product?.categorySlug,
    product?.category_name,
    product?.categoryName,
  ]);

  // حالت‌های اولیه
  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        <p className="text-zinc-600">در حال بارگذاری محصول…</p>
      </main>
    );
  }

  if (err || !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        <p className="text-rose-600">خطا: {err || "محصول پیدا نشد."}</p>
      </main>
    );
  }

  // گالری
  const galleryRaw: string[] = (
    Array.isArray(product.images) && product.images.length
      ? product.images
      : Array.isArray(product.gallery) && product.gallery.length
      ? product.gallery
      : product.image
      ? [product.image]
      : []
  ) as string[];

  const images: string[] = galleryRaw.map((g, i) =>
    resolveImage(g, product.slug || String(product.id) + "_" + i)
  );
  const safeActive = Math.min(Math.max(active, 0), Math.max(images.length - 1, 0));
  const mainSrc = images[safeActive] ?? "/placeholder.png";
  const firstImage = images[0] ?? "/placeholder.png";

  const hasDiscount =
    !!product.discount_price && Number(product.discount_price) < Number(product.price);
  const discount =
    hasDiscount && product.discount_price
      ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      {/* نان‌ریزه‌ها */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>محصولات</span> <span>›</span>
        <span className="font-medium text-zinc-700">{product.name}</span>
      </nav>

      {/* سه ستون: گالری (چپ) | جزئیات (وسط) | باکس قیمت (راست) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr_360px] lg:items-start">
        {/* گالری – ستون ۱ (چپ) و در موبایل هم اول */}
        <section className="order-1 lg:order-none lg:col-start-1 lg:col-end-2">
          <div className="grid grid-cols-[72px_1fr] gap-4">
            <div className="flex max-h-[520px] flex-col gap-3 overflow-auto pr-1">
              {images.map((img, i) => {
                const activeClass = safeActive === i ? "ring-2 ring-zinc-900" : "ring-1 ring-zinc-200";
                return (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`relative z-0 h-20 w-16 overflow-hidden rounded-lg ${activeClass}`}
                    aria-label={`تصویر ${i + 1}`}
                  >
                    <Image src={img || "/placeholder.png"} alt={product.name} fill className="object-cover" sizes="64px" />
                  </button>
                );
              })}
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl ring-1 ring-zinc-200">
              <Image
                src={mainSrc}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(min-width:1024px) 420px, 100vw"
              />
            </div>
          </div>
        </section>

        {/* جزئیات – ستون ۲ (وسط) */}
        <section className="order-2 lg:order-none lg:col-start-2 lg:col-end-3">
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight text-zinc-900">
  {product.name}
</h1>
          <div className="mt-2 text-sm text-zinc-500">
            {product.brand ? <span className="mr-2">{product.brand}</span> : null}
          </div>

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

        {/* باکس قیمت/مزایا – ستون ۳ (راست) و در موبایل سوم */}
        <aside className="order-3 lg:order-none lg:col-start-3 lg:col-end-4">
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
                image={firstImage}
                className="h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* تب‌بندی */}
      <section className="mt-12">
        <ProductTabs
          features={featureList}
          description={descriptionHtml}
          sizeChart={sizeChart}
          reviewsEnabled={false}
          initialTab="features"
        />
      </section>

      {/* محصولات مشابه */}
      {(relatedLoading || related.length > 0) && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold text-zinc-900">محصولات مشابه</h2>

          {relatedLoading && <p className="text-sm text-zinc-500">در حال بارگذاری محصولات مشابه…</p>}

          {!relatedLoading && related.length === 0 && <p className="text-sm text-zinc-500">محصول مشابهی یافت نشد.</p>}

          {!relatedLoading && related.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => {
                const img = resolveImage((Array.isArray(p.images) && p.images[0]) || p.image, p.slug || String(p.id));
                const hasOff = !!p.discount_price && Number(p.discount_price) < Number(p.price);
                const off =
                  hasOff && p.discount_price
                    ? Math.round((1 - Number(p.discount_price) / Number(p.price)) * 100)
                    : 0;

                return (
                  <Link
                    key={p.slug || p.id}
                    href={`/product/${p.slug ?? p.id}`}
                    className="group rounded-2xl border border-zinc-200 bg-white p-3 hover:shadow-sm transition"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl ring-1 ring-zinc-100">
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(min-width:1024px) 240px, 50vw"
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
          )}
        </section>
      )}
    </main>
  );
}
