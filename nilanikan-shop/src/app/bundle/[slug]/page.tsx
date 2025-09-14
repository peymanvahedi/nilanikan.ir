// src/app/bundle/[slug]/page.tsx
"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { get, endpoints, absolutizeMedia } from "../../../lib/api";
import BundleItemPicker from "../../../components/BundleItemPicker";
import BundleItemsTabs from "../../../components/BundleItemsTabs";

/* ==================== Types ==================== */
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
  attributes?: any[] | null;
  sizeTable?: string | null;
  size_chart?: string | null;
  sizeChart?: string | null;
};

type VideoItem = {
  id: number;
  title?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  order?: number;
  is_primary?: boolean;
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
  videos?: VideoItem[] | null;
  bundle_price?: number | string | null;
  price?: number | string | null;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
  items?: Array<{ productId: number; name: string; price: number; quantity?: number; image?: string | null }> | null;
  products?: Product[] | null;
};

type BundleItem = {
  productId: number;
  name: string;
  price: number;
  quantity?: number;
  image?: string | null;
};

/* ==================== Helpers ==================== */
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

function isExternalVideo(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be") || u.includes("aparat.com") || u.includes("vimeo.com");
}

function toEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("youtube.com")) {
      const vid = u.searchParams.get("v");
      if (vid) return `https://www.youtube.com/embed/${vid}`;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
    if (host.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes("aparat.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const vIdx = parts.findIndex((p) => p === "v" || p === "video");
      const code = vIdx >= 0 ? parts[vIdx + 1] : parts[0];
      if (code) return `https://www.aparat.com/video/video/embed/videohash/${code}/vt/frame`;
      return raw;
    }
    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
      return raw;
    }
    return raw;
  } catch {
    return null;
  }
}

// نگاشت عمومی ویژگی‌ها
function toNameValue(attrs: any): AttrPair[] {
  if (!attrs) return [];
  const arr = Array.isArray(attrs)
    ? attrs
    : typeof attrs === "object"
    ? Object.entries(attrs).map(([k, v]) => ({ name: k, value: v }))
    : [];
  return arr
    .map((x: any) => {
      const name =
        x?.name ??
        x?.attribute?.name ??
        x?.attribute_name ??
        x?.key ??
        x?.title ??
        null;

      let value: any =
        x?.value ??
        x?.value_text ??
        x?.value_name ??
        x?.option ??
        x?.label ??
        x?.values ??
        x?.options ??
        x?.items ??
        null;

      if (Array.isArray(value)) value = value.filter(Boolean).join("، ");
      else if (typeof value === "object" && value) {
        value =
          (value as any)?.name ??
          (value as any)?.title ??
          (Array.isArray((value as any)?.values)
            ? (value as any).values.filter(Boolean).join("، ")
            : JSON.stringify(value));
      }

      return (name || value) ? { name, value: value ?? "" } : null;
    })
    .filter(Boolean) as AttrPair[];
}

// آیتم‌های باندل را یکدست می‌کنیم
function normalizeBundleItems(bundle: Bundle): BundleItem[] {
  if (Array.isArray(bundle.items) && bundle.items.length > 0) {
    return bundle.items.map((it: any): BundleItem => ({
      productId: Number(it.productId),
      name: String(it.name ?? ""),
      price: Number(it.price ?? 0),
      quantity: it.quantity ?? 1,
      image: it.image ?? null,
    }));
  }
  if (Array.isArray(bundle.products) && bundle.products.length > 0) {
    return bundle.products.map((p: any, idx: number): BundleItem => ({
      productId: Number(p.id),
      name: p.title || p.name || `آیتم ${idx + 1}`,
      price:
        Number(
          String(p.price ?? "0")
            .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
            .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
            .replace(/[^\d.-]/g, "")
        ) || 0,
      quantity: 1,
      image:
        absolutizeMedia(
          p.image ||
            p.thumbnail ||
            (Array.isArray(p.images) ? p.images[0] : undefined) ||
            undefined
        ) || null,
    }));
  }
  return [];
}

// گرفتن محصول با id/slug/سرچ
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

/* ==================== UI Pieces ==================== */
function VideoModal({ open, onClose, video }: { open: boolean; onClose: () => void; video: VideoItem | null }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !video) return null;

  const isExt = isExternalVideo(video.url);
  const embed = isExt ? toEmbedUrl(video.url) : null;
  const src = isExt ? embed || video.url : absolutizeMedia(video.url) || video.url;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <button
        aria-label="بستن ویدیو"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-zinc-800 shadow focus:outline-none"
      >
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71L12 12.01l-6.29-6.3-1.42 1.42L10.59 13.4l-6.3 6.29 1.42 1.42 6.29-6.3 6.29 6.3 1.42-1.42-6.3-6.29 6.3-6.29z"/></svg>
      </button>
      <div className="absolute inset-0 grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-zinc-700">
          {isExt ? (
            <iframe title={video.title || "video"} src={src || undefined} className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" />
          ) : (
            <video key={src || ""} src={src || ""} controls playsInline className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}

function MobileGallery({
  images, alt, onVideoClick, showVideoBtn,
}: { images: string[]; alt: string; onVideoClick: () => void; showVideoBtn: boolean; }) {
  return (
    <div className="lg:hidden relative">
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <div key={i} className="relative flex-shrink-0 snap-center w-[80%] sm:w-[55%] aspect-[4/5] rounded-xl ring-1 ring-zinc-200 overflow-hidden">
            <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="80vw" />
          </div>
        ))}
      </div>
      {showVideoBtn && (
        <button onClick={onVideoClick} className="absolute right-3 top-3 h-11 w-11 grid place-items-center rounded-full bg-black/55 text-white shadow-md" aria-label="ویدیو" title="ویدیو">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </button>
      )}
    </div>
  );
}

function DesktopGallery({
  images, alt, active, setActive, onVideoClick, showVideoBtn,
}: { images: string[]; alt: string; active: number; setActive: (i: number) => void; onVideoClick: () => void; showVideoBtn: boolean; }) {
  const main = images[active] || images[0] || "/placeholder.svg";
  return (
    <div className="hidden lg:block">
      <div className="relative">
        <div className="relative aspect-[4/5] w-full rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
          <Image src={main || "/placeholder.svg"} alt={alt} fill className="object-cover"
                 sizes="(min-width:1536px) 520px, (min-width:1280px) 380px, 340px" priority />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          {showVideoBtn && (
            <button onClick={onVideoClick} className="h-10 w-10 grid place-items-center rounded-full bg-white/90 text-zinc-800 ring-1 ring-zinc-200 shadow hover:bg-white" aria-label="مشاهده ویدیو" title="مشاهده ویدیو">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <button key={i} onClick={() => setActive(i)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden ring-1 ${active === i ? "ring-2 ring-pink-600" : "ring-zinc-200"}`}
                  aria-label={`تصویر ${i + 1}`} title={`تصویر ${i + 1}`}>
            <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="80px" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ==================== Page ==================== */
export default function BundleDetailPage() {
  const params = useParams() as { slug?: string } | null;
  const router = useRouter();
  const slug = params?.slug ?? "";

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [active, setActive] = useState(0);

  const [summary, setSummary] = useState({ total: 0, subtotal: 0, discountAmount: 0, selectedCount: 0, selectedQty: 0 });
  const handleSummaryChange = useCallback((s: typeof summary) => setSummary(s), []);

  const [productsFull, setProductsFull] = useState<Product[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  // دریافت باندل
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const data = await get<any>(`${endpoints.bundles}${encodeURIComponent(slug)}/`, { throwOnHTTP: false });
        if (!alive) return;
        if (data && !data?.detail) {
          setBundle(data as Bundle);
          if (data.slug && slug !== data.slug) router.replace(`/bundle/${encodeURIComponent(data.slug)}`);
        } else {
          const resp = await get<any>(`${endpoints.bundles}?slug=${encodeURIComponent(slug)}`, { throwOnHTTP: false, fallback: { results: [] } });
          const arr = listify<Bundle>(resp);
          const found = arr.find((b) => b?.slug === slug) ?? null;
          if (found) setBundle(found); else setErr("باندل پیدا نشد");
        }
      } catch (e: any) {
        if (!alive) return; setErr(e?.message || "باندل پیدا نشد");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, router]);

  // در صورت نبود attributes، محصولات را جداگانه بگیر
  useEffect(() => {
    (async () => {
      if (!bundle) return;
      const hasAttrsOnBundleProducts =
        Array.isArray(bundle.products) &&
        bundle.products.some((p: any) => Array.isArray(p?.attributes) && (p!.attributes as any[]).length > 0);

      if (hasAttrsOnBundleProducts) {
        setProductsFull([]);
        return;
      }

      const items = normalizeBundleItems(bundle);
      if (!items.length) return;

      const out: Product[] = [];
      for (const it of items) {
        const p = await fetchProductAny(String(it.productId));
        if (p) out.push(p as Product);
      }
      setProductsFull(out);
    })();
  }, [bundle]);

  const name = bundle?.title || bundle?.name || "باندل";

  // گالری تصاویر
  const images = useMemo(() => {
    if (!bundle) return [] as string[];
    const galleryRaw: string[] = [
      ...(Array.isArray(bundle.images) ? bundle.images! : []),
      ...(Array.isArray(bundle.gallery) ? bundle.gallery!.map((g) => g.image) : []),
      ...(bundle.image ? [bundle.image] : []),
    ];
    return galleryRaw.map((g, i) => resolveImage(g, (bundle?.slug || "bundle") + "_" + i));
  }, [bundle]);

  // ویدیوها
  const videos = useMemo<VideoItem[]>(() => {
    if (!bundle?.videos || !Array.isArray(bundle.videos)) return [];
    return bundle.videos
      .filter((v): v is VideoItem => !!v && !!v.url)
      .map((v) => ({
        ...v,
        url: absolutizeMedia(v.url) || v.url,
        thumbnailUrl: absolutizeMedia(v.thumbnailUrl || undefined) || v.thumbnailUrl || null,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [bundle]);

  const showVideoBtn = videos.length > 0;

  // آیتم‌ها برای پیکر
  const normalizedItems = useMemo<BundleItem[]>(
    () => (bundle ? normalizeBundleItems(bundle) : []),
    [bundle]
  );
  const hasItems = normalizedItems.length > 0;

  // محصولات برای تب پایین
  const productsForTabs = useMemo(() => {
    const source: Product[] =
      (Array.isArray(bundle?.products) && bundle!.products!.length > 0
        ? (bundle!.products as Product[])
        : productsFull.length > 0
        ? productsFull
        : []);

    if (source.length > 0) {
      return source.map((p: Product) => {
        const img =
          p.image ??
          p.thumbnail ??
          (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ??
          null;

        const attrsRaw =
          (p as any).attributes ??
          (p as any).attribute_values ??
          (p as any).specs ??
          (p as any).properties ??
          (p as any).options ??
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
          attributes: toNameValue(attrsRaw),
          sizeTable,
          thumbnail: p.thumbnail ?? null,
        };
      });
    }

    // اگر هنوز محصول کامل نداریم، حداقل کارت‌های ساده از items
    return normalizedItems.map((it: BundleItem) => ({
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
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>محصولات</span> <span>›</span>
        <span>ست‌ها</span> <span>›</span>
        <span className="font-semibold text-zinc-700">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)_320px] xl:grid-cols-[380px_minmax(0,1fr)_330px] 2xl:grid-cols-[420px_minmax(0,1fr)_340px] lg:items-start">
        {/* Gallery */}
        <section className="lg:col-start-1 lg:col-end-2">
          <MobileGallery
            images={images}
            alt={name}
            showVideoBtn={showVideoBtn}
            onVideoClick={() => { setVideoIndex(0); setVideoOpen(true); }}
          />
          <DesktopGallery
            images={images}
            alt={name}
            active={active}
            setActive={setActive}
            showVideoBtn={showVideoBtn}
            onVideoClick={() => { setVideoIndex(0); setVideoOpen(true); }}
          />
        </section>

        {/* Middle: desc + picker */}
        <section className="lg:col-start-2 lg:col-end-3 min-w-0">
          <header className="mb-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900">{name}</h1>
            <div className="mt-1 text-xs text-zinc-500">کد: {bundle.slug}</div>
          </header>

          {bundle.description && (
            <div className="prose prose-sm max-w-none mt-4" dangerouslySetInnerHTML={{ __html: String(bundle.description) }} />
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

        {/* Right: price box */}
        <aside className="lg:col-start-3 lg:col-end-4">
          <div className="sticky top-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="rounded-xl bg-pink-50 p-3 text-center">
              <div className="text-sm font-extrabold text-pink-700">قیمت نهایی بر اساس انتخاب شما</div>
              <div className="mt-1 text-[22px] font-extrabold text-pink-700">
                {summary.total.toLocaleString("fa-IR")} <span className="text-sm">تومان</span>
              </div>
              {summary.discountAmount > 0 ? (
                <div className="mt-1 text-xs text-emerald-600">تخفیف: {summary.discountAmount.toLocaleString("fa-IR")} تومان</div>
              ) : null}
            </div>

            <ul className="mt-4 space-y-2 text-xs text-zinc-600">
              <li>ارسال سریع</li>
              <li>ضمانت اصالت کالا</li>
              <li>امکان انتخاب آیتم‌های دلخواه از این باندل</li>
            </ul>

            <a href="#bundle-items" className="mt-5 hidden md:block h-11 w-full rounded-xl bg-pink-600 text-white text-sm font-bold text-center leading-[44px] hover:bg-pink-700">
              انتخاب آیتم‌ها و افزودن به سبد
            </a>
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <BundleItemsTabs products={productsForTabs} />
      </div>

      {/* Video modal */}
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} video={videos[videoIndex] ?? null} />
    </main>
  );
}
