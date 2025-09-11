"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { get, endpoints, absolutizeMedia } from "../../../lib/api";
import BundleItemPicker from "../../../components/BundleItemPicker";
import BundleItemsTabs from "../../../components/BundleItemsTabs";

type Product = {
  id: number;
  slug?: string;
  title?: string;
  name?: string;
  price?: number | string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: string[];
  description?: string | null;
  attributes?: Array<{ name?: string; value?: string }> | null;
  sizeTable?: string | null;
};

type Bundle = {
  id: number;
  slug: string;
  title?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  images?: string[];
  gallery?: { id: number; image: string; alt?: string | null }[];
  bundle_price?: number | string;
  price?: number | string;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
  items?: Array<{ productId: number; name: string; price: number; quantity?: number; image?: string | null }>;
  products?: Product[];
};

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
      productId: p.id,
      name: p.title || p.name || `آیتم ${idx + 1}`,
      price: toNum(p.price),
      quantity: 1,
      image: absolutizeMedia(p.image || p.thumbnail || p.images?.[0] || undefined) || null,
    }));
  }
  return [] as Array<{ productId: number; name: string; price: number; quantity?: number; image?: string | null }>;
}

async function fetchBundleAny(key: string): Promise<Bundle | null> {
  const direct = await get<any>(`${endpoints.bundles}${encodeURIComponent(key)}/`, { throwOnHTTP: false });
  if (direct && !direct?.detail) return direct as Bundle;

  let resp = await get<any>(`${endpoints.bundles}?slug=${encodeURIComponent(key)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  let arr = listify<Bundle>(resp);
  let found = arr.find((b) => b?.slug === key) ?? null;
  if (found) return found;

  if (/^\d+$/.test(key)) {
    for (const k of ["id", "pk"]) {
      resp = await get<any>(`${endpoints.bundles}?${k}=${encodeURIComponent(key)}`, {
        throwOnHTTP: false, fallback: { results: [] },
      });
      arr = listify<Bundle>(resp);
      found = arr.find((b) => String(b?.id) === key) ?? null;
      if (found) return found;
    }
  }

  resp = await get<any>(`${endpoints.bundles}?search=${encodeURIComponent(key)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  arr = listify<Bundle>(resp);
  const found2 =
    arr.find((b) => b?.slug === key) ??
    (arr.find((b) => /^\d+$/.test(key) && String(b?.id) === key) ?? null);
  return found2 ?? null;
}

function MobileGallery({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className="lg:hidden">
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 snap-center w-[80%] sm:w-[55%] aspect-[4/5] rounded-xl ring-1 ring-zinc-200 overflow-hidden"
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
          src={main || "/placeholder.svg"}
          alt={alt}
          fill
          className="object-cover"
          sizes="(min-width:1536px) 520px, (min-width:1280px) 380px, 340px"
          priority
        />
      </div>
    </div>
  );
}

export default function BundleDetailPage() {
  const params = useParams() as { slug?: string } | null;
  const router = useRouter();
  const slug = params?.slug ?? "";

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const [summary, setSummary] = useState({
    total: 0, subtotal: 0, discountAmount: 0, selectedCount: 0, selectedQty: 0,
  });
  const handleSummaryChange = useCallback((s: typeof summary) => setSummary(s), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await fetchBundleAny(slug);
        if (!alive) return;
        if (data) {
          setBundle(data);
          if (data.slug && slug !== data.slug) router.replace(`/bundle/${encodeURIComponent(data.slug)}`);
        } else {
          setErr("باندل پیدا نشد");
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

  const name = bundle?.title || bundle?.name || "باندل";

  const images = useMemo(() => {
    if (!bundle) return [] as string[];
    const galleryRaw: string[] = [
      ...(Array.isArray(bundle.images) ? bundle.images : []),
      ...(Array.isArray(bundle.gallery) ? bundle.gallery.map((g) => g.image) : []),
      ...(bundle.image ? [bundle.image] : []),
    ];
    return galleryRaw.map((g, i) => resolveImage(g, (bundle?.slug || "bundle") + "_" + i));
  }, [bundle]);

  const normalizedItems = useMemo(() => (bundle ? normalizeBundleItems(bundle) : []), [bundle]);
  const hasItems = normalizedItems.length > 0;

  // ✅ پاس دادن توضیحات، ویژگی‌ها و جدول سایز
  const productsForTabs = useMemo(() => {
    if (Array.isArray(bundle?.products) && bundle!.products.length > 0) {
      return bundle!.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name || p.title,
        title: p.title,
        price: p.price,
        image: p.image || p.thumbnail || (p.images?.[0] ?? null),
        images: p.images ?? [],
        description: p.description ?? null,
        attributes: p.attributes ?? [],
        sizeTable: p.sizeTable ?? null,
        thumbnail: p.thumbnail ?? null,
      }));
    }

    return normalizedItems.map((it) => ({
      id: it.productId,
      name: it.name,
      title: it.name,
      price: it.price,
      image: it.image || null,
      images: it.image ? [it.image] : [],
      description: "",
      attributes: [],
      sizeTable: null,
      slug: null,
      thumbnail: null,
    }));
  }, [bundle, normalizedItems]);

  if (loading)
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">در حال بارگذاری…</main>;
  if (err || !bundle)
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">خطا: {err || "باندل پیدا نشد."}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8" dir="rtl">
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
        <section className="lg:col-start-1 lg:col-end-2">
          <MobileGallery images={images} alt={name} />
          <DesktopGallery images={images} alt={name} active={active} setActive={setActive} />
        </section>

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
                title={bundle.title || bundle.name}
                discountType={bundle.discountType}
                discountValue={bundle.discountValue}
                items={normalizedItems}
                onSummaryChange={handleSummaryChange}
              />
            </div>
          )}
        </section>

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

      <div className="mt-10">
        <BundleItemsTabs products={productsForTabs} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="text-zinc-600">جمع انتخابی</div>
            <div className="text-pink-600 font-extrabold">
              {summary.total.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
            </div>
          </div>
          <a
            href="#bundle-items"
            className="h-10 rounded-xl bg-pink-600 px-3 text-xs font-bold text-white hover:bg-pink-700"
          >
            افزودن به سبد
          </a>
        </div>
      </div>
    </main>
  );
}
