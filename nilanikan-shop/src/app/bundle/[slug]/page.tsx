// src/app/bundle/[slug]/page.tsx
"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { get, endpoints, absolutizeMedia } from "../../../lib/api";
import BundleItemPicker from "../../../components/BundleItemPicker";
import BundleItemsTabs from "../../../components/BundleItemsTabs";

// ---------- Types ----------
type AttrPair = { name?: string | null; value?: string | null };

type Product = {
  id: number;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  price?: number | string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: string[] | null;
  description?: string | null;
  // ممکن است از API به شکل‌های مختلف بیاید:
  attributes?: any[] | null;
  sizeTable?: string | null;
  size_chart?: string | null;
  sizeChart?: string | null;
};

type Bundle = {
  id: number;
  slug: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[] | null;
  gallery?: { id: number; image: string; alt?: string | null }[] | null;
  bundle_price?: number | string | null;
  price?: number | string | null;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
  // یکی از این‌ها خواهد بود
  items?: Array<{ productId: number; name: string; price: number; quantity?: number; image?: string | null }> | null;
  products?: Product[] | null;
};

// ---------- Helpers ----------
const listify = <T = any,>(x: any): T[] =>
  Array.isArray(x) ? x : Array.isArray(x?.results) ? x.results : [];

function toNum(v: any): number {
  if (v == null || v === "") return 0;
  const en = String(v)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const isRial = /ریال/i.test(en);
  const n = Number(en.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return isRial ? Math.round(n / 10) : n;
}

const resolveImage = (src?: string | null, seed?: string) => {
  const abs = absolutizeMedia(src || undefined);
  if (abs) return abs;
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "bundle")}/1200/1200`;
};

// آرایه‌ی آیتم‌های باندل را یکدست می‌کنیم
function normalizeBundleItems(bundle: Bundle) {
  if (Array.isArray(bundle.items) && bundle.items.length > 0) {
    return bundle.items.map((it) => ({
      productId: it.productId,
      name: it.name,
      price: Number(it.price),
      quantity: it.quantity ?? 1,
      image: it.image ?? null,
    }));
  }
  if (Array.isArray(bundle.products) && bundle.products.length > 0) {
    return bundle.products.map((p, idx) => ({
      productId: Number(p.id),
      name: p.title || p.name || `آیتم ${idx + 1}`,
      price: toNum(p.price),
      quantity: 1,
      image: absolutizeMedia(p.image || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : undefined) || undefined) || null,
    }));
  }
  return [] as Array<{ productId: number; name: string; price: number; quantity?: number; image?: string | null }>;
}

// گرفتن محصول با id/slug/سرچ (از صفحه‌ی محصول برداشته شده)
async function fetchProductAny(key: string) {
  const direct = await get<any>(`${endpoints.products}${encodeURIComponent(key)}/`, { throwOnHTTP: false });
  if (direct && !direct?.detail) return direct;

  let resp = await get<any>(`${endpoints.products}?slug=${encodeURIComponent(key)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  let arr = listify(resp);
  let found = arr.find((p: any) => p?.slug === key);
  if (found) return found;

  if (/^\d+$/.test(key)) {
    for (const k of ["id", "pk"]) {
      resp = await get<any>(`${endpoints.products}?${k}=${encodeURIComponent(key)}`, {
        throwOnHTTP: false, fallback: { results: [] },
      });
      arr = listify(resp);
      found = arr.find((p: any) => String(p?.id) === key);
      if (found) return found;
    }
  }

  resp = await get<any>(`${endpoints.products}?search=${encodeURIComponent(key)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  arr = listify(resp);
  found = arr.find((p: any) => p?.slug === key) ?? arr.find((p: any) => /^\d+$/.test(key) && String(p?.id) === key);
  return found ?? null;
}

// attributes را به [{name,value}] تبدیل می‌کند
function toNameValue(attrs: any): AttrPair[] {
  const a = Array.isArray(attrs) ? attrs : [];
  return a
    .map((x) => {
      const name = x?.name ?? x?.attribute ?? null;
      const value =
        x?.value ??
        (Array.isArray(x?.values) ? x.values.filter(Boolean).join("، ") : null) ??
        x?.value_text ??
        null;
      return !name && !value ? null : ({ name, value } as AttrPair);
    })
    .filter(Boolean) as AttrPair[];
}

// ---------- UI Helpers ----------
function MobileGallery({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className="lg:hidden">
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <div key={i} className="relative flex-shrink-0 snap-center w-[80%] sm:w-[55%] aspect-[4/5] rounded-xl ring-1 ring-zinc-200 overflow-hidden">
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
    <div className="hidden lg:grid grid-cols-[64px_minmax(0,1fr)] gap-3">
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-1">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-[64px] w-[64px] rounded-md overflow-hidden ring-1 ${
              active === i ? "ring-2 ring-pink-600" : "ring-zinc-200"
            }`}
            aria-label={`تصویر ${i + 1}`}
          >
            <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] w-full rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
        <Image
          src={main || "/placeholder.svg"} alt={alt} fill className="object-cover"
          sizes="(min-width:1536px) 520px, (min-width:1280px) 380px, 340px" priority
        />
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function BundleDetailPage() {
  const params = useParams() as { slug?: string } | null;
  const router = useRouter();
  const slug = params?.slug ?? "";

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  // خلاصه‌ی قیمت از پیکر
  const [summary, setSummary] = useState({ total: 0, subtotal: 0, discountAmount: 0, selectedCount: 0, selectedQty: 0 });
  const handleSummaryChange = useCallback((s: typeof summary) => setSummary(s), []);

  // محصولات کامل (وقتی باندل خودش attributes ندارد)
  const [productsFull, setProductsFull] = useState<Product[]>([]);

  // دریافت باندل
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await get<any>(`${endpoints.bundles}${encodeURIComponent(slug)}/`, { throwOnHTTP: false });
        if (!alive) return;
        if (data && !data?.detail) {
          setBundle(data as Bundle);
          if (data.slug && slug !== data.slug) router.replace(`/bundle/${encodeURIComponent(data.slug)}`);
        } else {
          // جستجو بر اساس slug
          const resp = await get<any>(`${endpoints.bundles}?slug=${encodeURIComponent(slug)}`, {
            throwOnHTTP: false, fallback: { results: [] },
          });
          const arr = listify<Bundle>(resp);
          const found = arr.find((b) => b?.slug === slug) ?? null;
          if (found) setBundle(found);
          else setErr("باندل پیدا نشد");
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "باندل پیدا نشد");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, router]);

  // اگر attributes نداریم، محصولات آیتم‌ها را جداگانه بگیر
  useEffect(() => {
    (async () => {
      if (!bundle) return;
      const hasAttrsOnBundleProducts =
        Array.isArray(bundle.products) &&
        bundle.products.some((p) => Array.isArray(p?.attributes) && (p!.attributes as any[]).length > 0);

      if (hasAttrsOnBundleProducts) {
        setProductsFull([]); // نیازی نیست
        return;
      }

      const items = normalizeBundleItems(bundle);
      if (!items.length) return;

      // گرفتن محصولات با id (سریالی برای ساده بودن/کاهش فشار)
      const out: Product[] = [];
      for (const it of items) {
        const p = await fetchProductAny(String(it.productId));
        if (p) out.push(p as Product);
      }
      setProductsFull(out);
    })();
  }, [bundle]);

  const name = bundle?.title || bundle?.name || "باندل";

  // گالری
  const images = useMemo(() => {
    if (!bundle) return [] as string[];
    const galleryRaw: string[] = [
      ...(Array.isArray(bundle.images) ? bundle.images! : []),
      ...(Array.isArray(bundle.gallery) ? bundle.gallery!.map((g) => g.image) : []),
      ...(bundle.image ? [bundle.image] : []),
    ];
    return galleryRaw.map((g, i) => resolveImage(g, (bundle?.slug || "bundle") + "_" + i));
  }, [bundle]);

  // آیتم‌ها برای پیکر سبد
  const normalizedItems = useMemo(() => (bundle ? normalizeBundleItems(bundle) : []), [bundle]);
  const hasItems = normalizedItems.length > 0;

  // محصولات برای تب پایین (همیشه [{name,value}] بده)
  const productsForTabs = useMemo(() => {
    const source: Product[] =
      (Array.isArray(bundle?.products) && bundle!.products!.length > 0 ? (bundle!.products as Product[]) :
        productsFull.length > 0 ? productsFull : []);

    if (source.length > 0) {
      return source.map((p) => {
        const img =
          p.image ??
          p.thumbnail ??
          (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ??
          null;

        const images = Array.isArray(p.images) ? (p.images.filter(Boolean) as string[]) : [];

        const sizeTable =
          (p as any).sizeTable ?? p.size_chart ?? p.sizeChart ?? null;

        return {
          id: Number(p.id),
          slug: p.slug ?? null,
          name: p.name || p.title || "",
          title: p.title || p.name || "",
          price: p.price ?? null,
          image: img,
          images,
          description: p.description ?? null,
          attributes: toNameValue(p.attributes),
          sizeTable,
          thumbnail: p.thumbnail ?? null,
        };
      });
    }

    // اگر هنوز محصول کامل نداریم، حداقل کارت‌های ساده از items
    return normalizedItems.map((it) => ({
      id: it.productId,
      slug: null,
      name: it.name,
      title: it.name,
      price: it.price,
      image: it.image || null,
      images: it.image ? [it.image] : [],
      description: "",
      attributes: [] as AttrPair[],
      sizeTable: null,
      thumbnail: null,
    }));
  }, [bundle, productsFull, normalizedItems]);

  if (loading)
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">در حال بارگذاری…</main>;
  if (err || !bundle)
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">خطا: {err || "باندل پیدا نشد."}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8" dir="rtl">
      {/* breadcrumbs */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>محصولات</span> <span>›</span>
        <span>ست‌ها</span> <span>›</span>
        <span className="font-semibold text-zinc-700">{name}</span>
      </nav>

      <div
        className="
          grid grid-cols-1 gap-8
          lg:grid-cols-[340px_minmax(0,1fr)_320px]
          xl:grid-cols-[380px_minmax(0,1fr)_330px]
          2xl:grid-cols-[420px_minmax(0,1fr)_340px]
          lg:items-start
        "
      >
        {/* Gallery */}
        <section className="lg:col-start-1 lg:col-end-2">
          <MobileGallery images={images} alt={name} />
          <DesktopGallery images={images} alt={name} active={active} setActive={setActive} />
        </section>

        {/* Middle column: description + picker */}
        <section className="lg:col-start-2 lg:col-end-3 min-w-0">
          <header className="mb-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900">{name}</h1>
            <div className="mt-1 text-xs text-zinc-500">کد: {bundle.slug}</div>
          </header>

          {bundle.description && (
            <div
              className="prose prose-sm max-w-none mt-4"
              dangerouslySetInnerHTML={{ __html: String(bundle.description) }}
            />
          )}

          {hasItems && (
            <div id="bundle-items" className="mt-6">
              <BundleItemPicker
                bundleId={bundle.id}
                title={bundle.title || bundle.name || undefined}
                discountType={bundle.discountType ?? null}
                discountValue={bundle.discountValue ?? null}
                items={normalizedItems}
                onSummaryChange={handleSummaryChange}
              />
            </div>
          )}
        </section>

        {/* Right column: price box */}
        <aside className="lg:col-start-3 lg:col-end-4">
          <div className="sticky top-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="rounded-xl bg-pink-50 p-3 text-center">
              <div className="text-sm font-extrabold text-pink-700">قیمت نهایی بر اساس انتخاب شما</div>
              <div className="mt-1 text-[22px] font-extrabold text-pink-700">
                {summary.total.toLocaleString("fa-IR")} <span className="text-sm">تومان</span>
              </div>
              {summary.discountAmount > 0 ? (
                <div className="mt-1 text-xs text-emerald-600">
                  تخفیف: {summary.discountAmount.toLocaleString("fa-IR")} تومان
                </div>
              ) : null}
            </div>

            <ul className="mt-4 space-y-2 text-xs text-zinc-600">
              <li>ارسال سریع</li>
              <li>ضمانت اصالت کالا</li>
              <li>امکان انتخاب آیتم‌های دلخواه از این باندل</li>
            </ul>

            <a
              href="#bundle-items"
              className="mt-5 hidden md:block h-11 w-full rounded-xl bg-pink-600 text-white text-sm font-bold text-center leading-[44px] hover:bg-pink-700"
            >
              انتخاب آیتم‌ها و افزودن به سبد
            </a>
          </div>
        </aside>
      </div>

      {/* Tabs (features/size/description per item) */}
      <div className="mt-10">
        <BundleItemsTabs products={productsForTabs} />
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="text-zinc-600">جمع انتخابی</div>
            <div className="text-pink-600 font-extrabold">
              {summary.total.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
            </div>
          </div>
          <a href="#bundle-items" className="h-10 rounded-xl bg-pink-600 px-3 text-xs font-bold text-white hover:bg-pink-700">
            افزودن به سبد
          </a>
        </div>
      </div>
    </main>
  );
}
