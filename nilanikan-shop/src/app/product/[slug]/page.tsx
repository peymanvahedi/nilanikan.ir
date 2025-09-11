// src/app/product/[slug]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductTabs from "@/components/ProductTabs";
import { get, endpoints, absolutizeMedia } from "@/lib/api";
import AttributePicker, {
  SelectedAttrs,
  AttributeValue as AV,
} from "@/components/AttributePicker";

// ---------- Types ----------
type AttributeValue = {
  id: number;
  attribute: string;
  value: string;
  slug: string;
  color_code?: string | null;
};

type SizeChart = {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
};

type Product = {
  id: number;
  slug?: string;
  name: string;
  price: number;
  discount_price?: number | null;
  brand?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[];
  gallery?: { id: number; image: string; alt?: string | null }[];
  attributes?: AttributeValue[] | Record<string, any> | null;
  size_chart?: SizeChart | null;
  category?: string | number | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  [k: string]: any;
};

// ---------- Helpers ----------
const listify = <T = any,>(x: any): T[] =>
  Array.isArray(x) ? x : Array.isArray(x?.results) ? x.results : [];

async function fetchProductAny(key: string) {
  const direct = await get<any>(
    `${endpoints.products}${encodeURIComponent(key)}/`,
    { throwOnHTTP: false }
  );
  if (direct && !direct?.detail) return direct;

  let resp = await get<any>(`${endpoints.products}?slug=${encodeURIComponent(key)}`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });
  let arr = listify(resp);
  let found = arr.find((p: any) => p?.slug === key);
  if (found) return found;

  if (/^\d+$/.test(key)) {
    for (const k of ["id", "pk"]) {
      resp = await get<any>(`${endpoints.products}?${k}=${encodeURIComponent(key)}`, {
        throwOnHTTP: false,
        fallback: { results: [] },
      });
      arr = listify(resp);
      found = arr.find((p: any) => String(p?.id) === key);
      if (found) return found;
    }
  }

  resp = await get<any>(`${endpoints.products}?search=${encodeURIComponent(key)}`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });
  arr = listify(resp);
  found =
    arr.find((p: any) => p?.slug === key) ??
    arr.find((p: any) => /^\d+$/.test(key) && String(p?.id) === key);

  return found ?? null;
}

function resolveImage(src?: string | null, seed?: string) {
  const absolute = absolutizeMedia(src || undefined);
  if (absolute) return absolute;
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "prod")}/1200/1200`;
}
function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function toDescriptionHtml(desc?: string | null): string {
  if (!desc) return "";
  const parts = desc.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

// ---------- Galleries ----------
function MobileGallery({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className="lg:hidden">
      <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-2 [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 snap-center w-[80%] sm:w-[45%] aspect-[4/5] rounded-xl ring-1 ring-zinc-200 overflow-hidden"
          >
            <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="80vw" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopGallery({
  images, alt, active, setActive,
}: { images: string[]; alt: string; active: number; setActive: (i: number) => void }) {
  const main = images[active] || images[0] || "/placeholder.svg";
  return (
    <div className="hidden lg:grid grid-cols-[80px_1fr] gap-4">
      <div className="flex flex-col gap-2 overflow-y-auto max-h=[520px] pr-1">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-20 w-16 rounded-lg overflow-hidden ring-1 ${
              active === i ? "ring-2 ring-pink-600" : "ring-zinc-200"
            }`}
            aria-label={`تصویر ${i + 1}`}
          >
            <div className="relative h-20 w-16">
              <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="64px" />
            </div>
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] w-full rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
        <Image src={main || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="420px" priority />
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  // انتخاب ویژگی‌ها
  const [picked, setPicked] = useState<SelectedAttrs>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await fetchProductAny(slug);
        if (!alive) return;
        if (data) {
          setProduct(data);
          if (data.slug && slug !== data.slug && !/^\d+$/.test(data.slug)) {
            router.replace(`/product/${encodeURIComponent(data.slug)}`);
          }
        } else {
          setErr("محصول پیدا نشد");
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "خطا در دریافت اطلاعات محصول");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, router]);

  // یکنواخت‌سازی برای نمایش در تب‌ها
  const featuresForTabs = useMemo(() => {
    const a = product?.attributes;
    if (Array.isArray(a)) {
      return a.map(x => ({
        label: x.attribute,
        value: x.value,
        color_code: x.color_code ?? null,
      }));
    }
    if (a && typeof a === "object") {
      return Object.entries(a).map(([k, v]) => ({
        label: k,
        value: Array.isArray(v) ? v.join("، ") : String(v),
        color_code: null,
      }));
    }
    return [] as { label: string; value: string; color_code?: string | null }[];
  }, [product?.attributes]);

  // خلاصهٔ انتخاب‌شده‌ها برای چسباندن به نام محصول
  const pickedSummary = useMemo(() => {
    const entries = Object.entries(picked).filter(([, v]) => !!v);
    if (!entries.length) return "";
    return " (" + entries.map(([, v]) => `${v!.attribute}: ${v!.value}`).join(", ") + ")";
  }, [picked]);

  // آیا همهٔ گروه‌های ویژگی انتخاب شده‌اند؟
  const allAttrsChosen = useMemo(() => {
    const a = product?.attributes;
    if (!Array.isArray(a) || a.length === 0) return true; // ویژگی الزامی نداریم
    const reqNames = Array.from(new Set(a.map((x: AV) => x.attribute || "ویژگی")));
    return reqNames.every((name) => !!picked[name]);
  }, [product?.attributes, picked]);

  const descriptionHtml = useMemo(() => {
    const raw = product?.description ?? "";
    const looksLikeHtml = /<\w+[^>]*>/.test(raw);
    return looksLikeHtml ? raw : toDescriptionHtml(raw);
  }, [product?.description]);

  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">در حال بارگذاری…</main>;
  }
  if (err || !product) {
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">خطا: {err || "محصول پیدا نشد."}</main>;
  }

  const galleryRaw: string[] = [
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.gallery) ? product.gallery.map((g) => g.image) : []),
    ...(product.image ? [product.image] : []),
  ];
  const images: string[] = galleryRaw.map((g, i) =>
    resolveImage(g, (product.slug || String(product.id)) + "_" + i)
  );

  const hasDiscount =
    !!product.discount_price && Number(product.discount_price) < Number(product.price);
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
        </section>

        {/* Buy box */}
        <aside className="lg:col-start-3 lg:col-end-4">
          <div className="sticky top-4 rounded-2xl border border-zinc-200 p-4 bg-white">
            <div className="text-center">
              {hasDiscount && (
                <div className="mb-1 flex items-end justify-center gap-3">
                  <span className="rounded-lg bg-rose-600 px-2 py-0.5 text-xs font-extrabold text-white">
                    {toFa(discount)}٪
                  </span>
                  <del className="text-sm text-zinc-400">{toFa(Number(product.price))}</del>
                </div>
              )}
              <div className="text-2xl font-extrabold text-pink-600">
                {toFa(Number(product.discount_price ?? product.price))} <span className="text-sm">تومان</span>
              </div>
            </div>

            {/* انتخاب ویژگی‌ها */}
            {Array.isArray(product.attributes) && product.attributes.length > 0 && (
              <div className="mt-4">
                <AttributePicker
                  attributes={product.attributes as AV[]}
                  selected={picked}
                  onChange={setPicked}
                />
                {!allAttrsChosen && (
                  <div className="mt-2 text-xs text-amber-600">
                    لطفاً همهٔ ویژگی‌های موردنیاز را انتخاب کنید.
                  </div>
                )}
              </div>
            )}

            {/* Add to cart (غیرفعال‌سازی با CSS برای سازگاری) */}
            <div className={`mt-4 ${allAttrsChosen ? "" : "pointer-events-none opacity-60"}`}>
              <AddToCartButton
                id={Number(product.id)}
                price={Number(product.discount_price ?? product.price)}
                name={product.name + pickedSummary}
                image={images[0] || "/placeholder.svg"}
                className="h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <section className="mt-12">
        <ProductTabs
          showFeatures={false}                 // 👈 تب ویژگی‌ها را کلاً حذف کن
          features={
            Array.isArray(product.attributes)
              ? (product.attributes as AV[])
              : Object.entries(product.attributes ?? {}).map(([k, v]) =>
                  Array.isArray(v) ? `${k}: ${v.join("، ")}` : `${k}: ${String(v)}`
                )
          }
          description={descriptionHtml}
          sizeChart={product.size_chart}
          reviewsEnabled={false}
          initialTab="description"             // 👈 از تب توضیحات شروع کن
        />
      </section>

    </main>
  );
}
