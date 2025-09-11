// src/app/bundles/[slug]/page.tsx
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { get, endpoints, absolutizeMedia } from "@/lib/api";
import BundleItemPicker from "@/components/BundleItemPicker";
import RelatedBundlesSlider, { RelatedBundle } from "@/components/RelatedBundlesSlider";

// -------------------- Types --------------------
type Product = {
  id: number;
  slug?: string;
  title?: string;
  name?: string;
  price?: number | string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: string[];
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

type BaseMedia = { main: string; alt: string };

// -------------------- Utils --------------------
function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}
function toNum(v: any): number {
  if (v == null || v === "") return 0;
  const cleaned = String(v).replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
function resolveImage(
  x?: { image?: string | null } | string | null,
  altSlug = "bundle"
): BaseMedia {
  if (!x) return { main: "/placeholder.svg", alt: altSlug };
  if (typeof x === "string")
    return { main: absolutizeMedia(x) || "/placeholder.svg", alt: altSlug };
  return {
    main: absolutizeMedia(x.image || undefined) || "/placeholder.svg",
    alt: altSlug,
  };
}

// از bundle.items یا bundle.products آرایه یکسان می‌سازیم
function normalizeBundleItems(bundle: Bundle) {
  if (Array.isArray(bundle.items) && bundle.items.length > 0) {
    return bundle.items.map((it, idx) => ({
      productId: it.productId,
      name: it.name || `آیتم ${idx + 1}`,
      price: toNum(it.price),
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

function Gallery({
  main,
  thumbs,
  alt,
  active,
  setActive,
}: {
  main?: string | null;
  thumbs: Array<{ src?: string | null; alt?: string | null }>;
  alt: string;
  active: number;
  setActive: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[88px,1fr] gap-3 lg:gap-4">
      <div className="order-2 lg:order-1 flex lg:flex-col gap-2 overflow-auto lg:overflow-visible">
        {thumbs.map(({ src, alt }, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-20 w-20 lg:h-20 lg:w-20 shrink-0 rounded-xl overflow-hidden ring-1 ${
              i === active ? "ring-pink-500" : "ring-zinc-200"
            }`}
            aria-label={`تصویر ${i + 1}`}
          >
            <Image src={src || "/placeholder.svg"} alt={alt || ""} fill className="object-cover" sizes="84px" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] w-full rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
        <Image src={main || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="520px" priority />
      </div>
    </div>
  );
}

// -------------------- Page --------------------
export default function BundleDetailPage() {
  const params = useParams() as { slug?: string } | null;
  const slug = params?.slug ?? "";

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  // Related
  const [related, setRelated] = useState<RelatedBundle[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // fetch bundle
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const path = `${endpoints.bundles}${encodeURIComponent(slug)}/`;
        const data = await get<Bundle>(path, { throwOnHTTP: true });
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
  }, [slug]);

  // fetch related bundles (robust + fallbacks)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!bundle?.slug) return;
      setRelatedLoading(true);

      const normalize = (x: any) =>
        Array.isArray(x) ? x : Array.isArray(x?.results) ? x.results : [];

      try {
        const bslug = bundle.slug;
        const tries: string[] = [
          `${endpoints.bundles}?related_to=${encodeURIComponent(bslug)}&limit=12`,
          `${endpoints.bundles}?similar_to=${encodeURIComponent(bslug)}&limit=12`,
          `${endpoints.bundles}${encodeURIComponent(bslug)}/related/`,
        ];

        const cat =
          (bundle as any).category_slug ??
          (bundle as any).categorySlug ??
          (typeof (bundle as any).category === "string" ? (bundle as any).category : undefined);
        const brand =
          (bundle as any).brand_slug ??
          (bundle as any).brandSlug ??
          (typeof (bundle as any).brand === "string" ? (bundle as any).brand : undefined);

        if (cat) tries.push(`${endpoints.bundles}?category=${encodeURIComponent(cat)}&exclude=${encodeURIComponent(bslug)}&limit=12`);
        if (brand) tries.push(`${endpoints.bundles}?brand=${encodeURIComponent(brand)}&exclude=${encodeURIComponent(bslug)}&limit=12`);

        tries.push(`${endpoints.bundles}?exclude=${encodeURIComponent(bslug)}&limit=12`);
        tries.push(`${endpoints.bundles}?limit=12`);

        let final: any[] = [];
        for (const url of tries) {
          // برای دیباگ: ببینیم کدام مسیر جواب می‌دهد
          console.debug("[related-try]", url);
          const res = await get<any>(url, { throwOnHTTP: false, fallback: [] });
          const list = normalize(res);
          if (list?.length) {
            final = list.filter((b: any) => (b?.slug ?? b?.id) !== bslug);
            if (final.length) break;
          }
        }

        if (!alive) return;
        setRelated(final as RelatedBundle[]);
        console.debug("[related-final-count]", final.length);
      } catch (e) {
        if (!alive) return;
        console.debug("[related-error]", e);
        setRelated([]);
      } finally {
        if (alive) setRelatedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bundle?.slug]);

  // gallery
  const gallery = useMemo<BaseMedia[]>(() => {
    const g =
      (Array.isArray(bundle?.images) && bundle?.images?.length
        ? bundle?.images?.map((x) => ({ image: x }))
        : undefined) ||
      (Array.isArray(bundle?.gallery) ? bundle?.gallery : undefined) ||
      [];
    const galleryRaw: Array<{ image?: string | null; alt?: string | null }> = Array.isArray(g) ? g : [];
    return galleryRaw.map((g, i) => resolveImage(g, (bundle?.slug || "bundle") + "_" + i));
  }, [bundle]);

  const mainImage = gallery[active]?.main || resolveImage(bundle?.image, bundle?.slug).main;

  const basePrice = toNum(bundle?.bundle_price ?? bundle?.price);
  const normalizedItems = useMemo(() => (bundle ? normalizeBundleItems(bundle) : []), [bundle]);
  const hasItems = normalizedItems.length > 0;

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">در حال بارگذاری…</main>;
  if (err || !bundle) return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">خطا: {err || "باندل پیدا نشد."}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8" dir="rtl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>محصولات</span> <span>›</span>
        <span>باندل‌ها</span> <span>›</span>
        <span className="text-zinc-900">{bundle.title || bundle.name || "باندل"}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Gallery */}
        <section>
          <Gallery
            main={mainImage}
            thumbs={gallery.map((g) => ({ src: g.main, alt: bundle.slug }))}
            alt={bundle.title || bundle.name || bundle.slug}
            active={active}
            setActive={setActive}
          />
        </section>

        {/* Info / price */}
        <aside className="lg:pt-2">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-zinc-900">
            {bundle.title || bundle.name || "باندل"}
          </h1>

          {basePrice > 0 && (
            <div className="mt-4">
              <div className="text-[13px] text-zinc-500">قیمت کل باندل</div>
              <div className="text-xl md:text-2xl font-extrabold text-pink-600">
                {toFa(basePrice)} <span className="text-[12px] mr-1">تومان</span>
              </div>
            </div>
          )}

          {bundle.description && (
            <p className="mt-4 text-sm leading-7 text-zinc-700 whitespace-pre-line">
              {bundle.description}
            </p>
          )}

          <a
            href="#bundle-items"
            className="mt-6 inline-flex h-11 px-5 items-center justify-center rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 transition-colors"
          >
            انتخاب آیتم‌ها و افزودن به سبد
          </a>
        </aside>
      </div>

      {/* Bundle items */}
      {hasItems && (
        <section id="bundle-items" className="mt-10">
          <h2 className="mb-4 text-base md:text-lg font-bold text-zinc-900">آیتم‌های باندل</h2>
          <BundleItemPicker
            bundleId={bundle.id}
            title={bundle.title || bundle.name}
            discountType={bundle.discountType ?? null}
            discountValue={bundle.discountValue ?? null}
            items={normalizedItems}
          />
        </section>
      )}

      {/* Related bundles */}
      <section className="mt-14">
        <h2 className="mb-4 text-base md:text-lg font-bold text-zinc-900">محصولات مشابه</h2>
        {relatedLoading && <p className="text-sm text-zinc-500">در حال بارگذاری…</p>}
        {!relatedLoading && related.length === 0 && (
          <p className="text-sm text-zinc-500">موردی یافت نشد.</p>
        )}
        {!relatedLoading && related.length > 0 && <RelatedBundlesSlider items={related} />}
      </section>
    </main>
  );
}
