// src/app/product/[slug]/page.tsx
"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductTabs from "@/components/ProductTabs";
import { get, endpoints, absolutizeMedia } from "@/lib/api";
import AttributePicker, {
  SelectedAttrs,
  AttributeValue as AV,
} from "@/components/AttributePicker";
import ProductSizeNote from "@/components/ProductSizeNote";
import ProductReviewSummary from "@/components/ProductReviewSummary";
import CardSlider from "@/components/CardSlider"; // ⭐️ برای کاروسل «محصولات مشابه»

// ---------- Types ----------
type SizeChart = {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
};

// ⭐️ Variant برای قیمت سایز
type Variant = {
  id: number;
  size: AV;
  price: number;
  stock: number;
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
  attributes?: AV[] | Record<string, any> | null;
  size_chart?: SizeChart | null;
  category?: string | number | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  variants?: Variant[] | null; // ← اضافه
  stock?: number | null;
  [k: string]: any;
};

// ---------- Helpers ----------
const listify = <T = any,>(x: any): T[] =>
  Array.isArray(x) ? x : Array.isArray(x?.results) ? x.results : [];

async function fetchProductAny(key: string) {
  const direct = await get<any>(`${endpoints.products}${encodeURIComponent(key)}/`, {
    throwOnHTTP: false,
  });
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
  const main = images[active] || images[0] || "/placeholder.svg";
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
            <div className="relative h-20 w-16">
              <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="64px" />
            </div>
          </button>
        ))}
      </div>

      {/* ظرف اصلی با ارتفاع مشخص */}
      <div className="relative w-full h-[520px] rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
        <Image src={main || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="520px" priority />
      </div>
    </div>
  );
}

// ⭐️ یابندهٔ سایز از انتخاب‌ها
function getPickedSize(picked: SelectedAttrs | undefined | null): AV | null {
  if (!picked) return null;
  const keys = Object.keys(picked);
  const pref = ["size", "سایز", "اندازه", "maat", "尺码"];
  for (const k of pref) {
    const hit = keys.find((x) => x.toLowerCase() === k.toLowerCase());
    if (hit && picked[hit]) return picked[hit]!;
  }
  for (const k of keys) {
    if (picked[k]) return picked[k]!;
  }
  return null;
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

  // ⭐️ state برای محصولات مشابه
  const [related, setRelated] = useState<any[]>([]);
  const [relLoading, setRelLoading] = useState(false);

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
    return () => {
      alive = false;
    };
  }, [slug, router]);

  // خلاصهٔ انتخاب‌شده‌ها
  const pickedSummary = useMemo(() => {
    const entries = Object.entries(picked).filter(([, v]) => !!v);
    if (!entries.length) return "";
    return " (" + entries.map(([, v]) => `${v!.attribute}: ${v!.value}`).join(", ") + ")";
  }, [picked]);

  // آیا همهٔ گروه‌های ویژگی انتخاب شده‌اند؟
  const allAttrsChosen = useMemo(() => {
    const a = product?.attributes;
    if (!Array.isArray(a) || a.length === 0) return true;
    const reqNames = Array.from(new Set((a as AV[]).map((x) => x.attribute || "ویژگی")));
    return reqNames.every((name) => !!picked[name]);
  }, [product?.attributes, picked]);

  // HTML آمادهٔ توضیحات محصول
  const descriptionHtml = useMemo(() => {
    const raw = product?.description ?? "";
    const looksLikeHtml = /<\w+[^>]*>/.test(raw);
    return looksLikeHtml ? raw : toDescriptionHtml(raw);
  }, [product?.description]);

  // شناسایی وجود سایز/رنگ
  const { hasSize, hasColor, sizePicked, colorPicked } = useMemo(() => {
    const attrs = Array.isArray(product?.attributes) ? (product!.attributes as AV[]) : [];
    const names = attrs.map((x) => (x.attribute || "").toLowerCase());
    const sizeKeys = ["size", "سایز", "اندازه", "maat", "尺码"].map((s) => s.toLowerCase());
    const colorKeys = ["color", "رنگ", "colour", "لون"].map((s) => s.toLowerCase());
    const hasSize = names.some((n) => sizeKeys.includes(n));
    const hasColor = names.some((n) => colorKeys.includes(n));

    const pkeys = Object.keys(picked || {}).map((k) => k.toLowerCase());
    const sizePicked = pkeys.some((k) => sizeKeys.includes(k));
    const colorPicked = pkeys.some((k) => colorKeys.includes(k));

    return { hasSize, hasColor, sizePicked, colorPicked };
  }, [product?.attributes, picked]);

  // ⭐️ Variant انتخاب‌شده بر اساس سایز
  const selectedVariant: Variant | null = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    const ps = getPickedSize(picked);
    if (!ps) return null;
    return product.variants.find((v) => v.size?.id === ps.id) || null;
  }, [product?.variants, picked]);

  // ⭐️ قیمت نهایی برای نمایش (اولویت با Variant)
  const displayPrice = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.price);
    return Number(product?.discount_price ?? product?.price ?? 0);
  }, [selectedVariant, product?.discount_price, product?.price]);

  // ⭐️ وضعیت موجودی Variant (اگر نداشتیم، true)
  const variantInStock = selectedVariant ? (selectedVariant.stock ?? 0) > 0 : true;

  // ⭐️ تعداد موجودی برای نمایش (بعد از کامل شدن انتخاب‌ها)
  const stockLeft = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.stock ?? 0);
    return product?.stock != null ? Number(product.stock) : null;
  }, [selectedVariant, product?.stock]);

  // شرط نمایش موجودی: فقط وقتی همهٔ گروه‌های لازم انتخاب شدند
  const canShowStock =
    (hasSize ? sizePicked : true) && (hasColor ? colorPicked : true) && stockLeft != null;

  // پیام راهنما: وقتی یکی انتخاب شد و دیگری مانده
  const guidanceMessage = useMemo(() => {
    if (hasSize && sizePicked && hasColor && !colorPicked) return "لطفاً رنگ را انتخاب کنید.";
    if (hasColor && colorPicked && hasSize && !sizePicked) return "لطفاً سایز را انتخاب کنید.";
    return null;
  }, [hasSize, hasColor, sizePicked, colorPicked]);


// لیست ویژگی‌ها برای تب (سایز و رنگ جلوتر نمایش داده شوند)
const featureLines = useMemo(() => {
  const attrs = Array.isArray(product?.attributes) ? (product!.attributes as AV[]) : [];
  if (!attrs.length) return [] as string[];

  // ساخت "نام: مقدار"
  const lines = attrs
    .map((a) => {
      const label = String(a.attribute || "").trim();
      const value = String(a.value || "").trim();
      if (!label && !value) return null;
      return `${label}${value ? `: ${value}` : ""}`;
    })
    .filter(Boolean) as string[];

  // سایز/رنگ جلوتر بیایند
  const sizeKeys = ["size", "سایز", "اندازه", "maat", "尺码"].map((s) => s.toLowerCase());
  const colorKeys = ["color", "رنگ", "colour", "لون"].map((s) => s.toLowerCase());

  const score = (s: string) => {
    const low = s.toLowerCase();
    if (sizeKeys.some((k) => low.startsWith(k))) return 0;
    if (colorKeys.some((k) => low.startsWith(k))) return 1;
    return 2;
  };

  return [...lines].sort((a, b) => score(a) - score(b));
}, [product?.attributes]);


  // ---------- Related products ----------
  // مپ برای کارت محصول (استفاده در CardSlider)
  function toProductCardItem(r: any) {
    const title =
      String(
        r.title ??
          r.name ??
          r.product_name ??
          r.productTitle ??
          r.label ??
          r.caption ??
          r._raw?.title ??
          r._raw?.name ??
          r._raw?.name_fa ??
          r._raw?.title_fa ??
          `محصول ${r?.id ?? ""}`
      ) || "محصول";
    const imageUrl =
      r.imageUrl || r.image || r.thumbnail || r.main_image || r.cover || r.photo?.url || r.images?.[0] || "";
    const slug = r.slug ?? r.handle ?? r.seoSlug ?? r._raw?.slug;
    const href = slug ? `/product/${slug}` : undefined;
    return { ...r, title, name: title, imageUrl: String(imageUrl || ""), href, slug };
  }

  useEffect(() => {
    if (!product) return;
    let alive = true;
    (async () => {
      try {
        setRelLoading(true);
        // استراتژی 1: بر اساس دسته‌بندی
        const cat =
          product.category_slug ||
          product.categorySlug ||
          product.category ||
          product.categoryName ||
          product.category_name;
        const q1 = cat
          ? `${endpoints.products}?limit=20&category=${encodeURIComponent(String(cat))}`
          : `${endpoints.products}?limit=20`;

        let raw = await get<any>(q1, { throwOnHTTP: false, fallback: { results: [] } });
        let arr = listify(raw).filter((p: any) => String(p.id) !== String(product.id));

        // استراتژی 2 (fallback): سرچ نام
        if (arr.length < 6 && product.name) {
          const q2 = `${endpoints.products}?search=${encodeURIComponent(product.name.split(" ")[0] || "")}`;
          const raw2 = await get<any>(q2, { throwOnHTTP: false, fallback: { results: [] } });
          const arr2 = listify(raw2).filter(
            (p: any) => String(p.id) !== String(product.id) && !arr.find((x: any) => x.id === p.id)
          );
          arr = [...arr, ...arr2];
        }

        const items = arr.slice(0, 12).map(toProductCardItem);
        if (alive) setRelated(items);
      } finally {
        if (alive) setRelLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [product]);

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
      <div className="grid grid-cols-1 gap-8 lg:[grid-template-columns:420px_1fr_360px] lg:items-start">
        {/* Gallery */}
        <section className="lg:col-start-1 lg:col-end-2">
          <MobileGallery images={images} alt={product.name} />
          <DesktopGallery images={images} alt={product.name} active={active} setActive={setActive} />

          <ProductReviewSummary
            productId={product.id}
            productSlug={product.slug || String(product.id)}
            className="mt-3"
          />
        </section>

        {/* Details */}
        <section className="lg:col-start-2 lg:col-end-3">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-zinc-900">{product.name}</h1>

          <ProductSizeNote />

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
              <div className="text-2xl font-extrabولد text-pink-600">
                {toFa(Number(displayPrice))} <span className="text-sm">تومان</span>
              </div>
            </div>

            {/* انتخاب ویژگی‌ها */}
            {Array.isArray(product.attributes) && product.attributes.length > 0 && (
              <div className="mt-4">
                <AttributePicker attributes={product.attributes as AV[]} selected={picked} onChange={setPicked} />

                {/* پیام کوتاه راهنما: وقتی یکی انتخاب شده و دیگری مانده */}
                {guidanceMessage && (
                  <div className="mt-2 text-xs font-medium text-amber-600">
                    {guidanceMessage}
                  </div>
                )}

                {/* اگر هیچ‌کدام انتخاب نشده، پیام عمومی (اختیاری) */}
                {!guidanceMessage && !allAttrsChosen && (
                  <div className="mt-2 text-xs text-amber-600">
                    لطفاً ویژگی‌های موردنیاز (سایز/رنگ) را انتخاب کنید.
                  </div>
                )}

                {/* نمایش موجودی پس از کامل‌شدن انتخاب‌ها */}
                {canShowStock && (
                  <div
                    className={`mt-2 text-sm ${
                      (stockLeft ?? 0) <= 3 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {(stockLeft ?? 0) > 0
                      ? `تنها ${toFa(stockLeft!)} عدد باقی‌مانده`
                      : "ناموجود"}
                  </div>
                )}

                {/* اگر واریانت انتخاب‌شده ناموجود باشد */}
                {selectedVariant && !variantInStock && (
                  <div className="mt-2 text-xs text-red-600">ناموجود برای این انتخاب</div>
                )}
              </div>
            )}

            {/* Add to cart */}
            <div className={`mt-4 ${allAttrsChosen && variantInStock ? "" : "pointer-events-none opacity-60"}`}>
              <AddToCartButton
                id={Number(product.id)}
                // ⭐️ قیمت نهایی (واریانت یا تخفیف/قیمت محصول)
                price={Number(displayPrice)}
                name={product.name + pickedSummary}
                image={images[0] || "/placeholder.svg"}
                className="h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700"
                // ⭐️ برای جلوگیری از قاطی‌شدن سبد (محلی)
                // @ts-ignore
                _variantId={selectedVariant?.id ?? null}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <section className="mt-12">
        <ProductTabs
  showFeatures={true}
  features={featureLines}             // ⬅️ همین آرایه‌ی رشته‌ای
  description={descriptionHtml}
  sizeChart={product.size_chart}
  reviewsEnabled={true}
  productId={product.id}
  productSlug={product.slug || String(product.id)}
  initialTab="description"
/>

      </section>

      {/* ⭐️ Related products carousel */}
      {related.length > 0 && (
        <section className="mt-10">
          <CardSlider
            title="محصولات مشابه"
            items={related}
            ctaHref={product.category_slug ? `/collection/${product.category_slug}` : undefined}
            ctaText="مشاهده همه"
            hrefBase="/product"
            itemRibbon="ممکنه خوشت بیاد"
            itemRibbonTone="pink"
            variant="compact"
          />
        </section>
      )}
    </main>
  );
}
