// src/app/bundle/[slug]/page.tsx
"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { get, endpoints, absolutizeMedia } from "../../../lib/api";
import BundleItemPicker from "../../../components/BundleItemPicker";
import Link from "next/link";

// 👇 همان کامپوننت صفحه تکی
import AttributePicker, {
  SelectedAttrs,
  AttributeValue as AV,
} from "@/components/AttributePicker";

/* ==================== Types ==================== */
type AttrPair = { name?: string | null; value?: string | null };

type Variant = {
  id: number;
  size?: AV;
  price: number | string;
  stock?: number | null;
  attributes?: Array<{ name?: string; option?: string; value?: string }>;
  options?: Array<{ name?: string; value?: string }>;
  variation_attributes?: Record<string, string>;
};

type Product = {
  id: number;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  price?: number | string | null;
  discount_price?: number | string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: string[] | null;
  description?: string | null;
  attributes?: AV[] | Record<string, any> | null;
  variants?: Variant[] | null;
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
          (p as any).image || (p as any).thumbnail || (Array.isArray((p as any).images) ? (p as any).images[0] : undefined) || undefined
        ) || null,
    }));
  }
  return [];
}

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

/* ---------- Bundle fetcher: محکم و چندمسیره ---------- */
async function fetchBundleAny(slug: string): Promise<Bundle | null> {
  // 1) مسیر detail (…/bundles/{slug}/) — اگر API اجازه بدهد
  const direct = await get<any>(`${endpoints.bundles}${encodeURIComponent(slug)}/`, { throwOnHTTP: false });
  if (direct && !direct?.detail) return direct as Bundle;

  // 2) جست‌وجو دقیق با slug
  let resp = await get<any>(`${endpoints.bundles}?slug=${encodeURIComponent(slug)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  let arr = listify<Bundle>(resp);
  let found = arr.find((b) => b?.slug === slug);
  if (found) return found;

  // 3) بعضی API‌ها «code» دارند
  resp = await get<any>(`${endpoints.bundles}?code=${encodeURIComponent(slug)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  arr = listify<Bundle>(resp);
  found = arr.find((b: any) => b?.code === slug || b?.slug === slug);
  if (found) return found;

  // 4) اگر slug عددی بود، بر اساس id هم تست کنیم
  if (/^\d+$/.test(slug)) {
    resp = await get<any>(`${endpoints.bundles}?id=${encodeURIComponent(slug)}`, {
      throwOnHTTP: false, fallback: { results: [] },
    });
    arr = listify<Bundle>(resp);
    found = arr.find((b: any) => String(b?.id) === slug);
    if (found) return found;
  }

  // 5) جست‌وجوی آزاد
  resp = await get<any>(`${endpoints.bundles}?search=${encodeURIComponent(slug)}`, {
    throwOnHTTP: false, fallback: { results: [] },
  });
  arr = listify<Bundle>(resp);
  found =
  arr.find((b) => b?.slug === slug) ??
  arr.find((b: any) => String(b?.id) === slug);

  return found ?? null;
}

function hasSelectableOptions(p: any): boolean {
  if (!p) return false;

  if (Array.isArray(p?.attributes)) {
    const arr = p.attributes as any[];
    if (arr.length > 0) return true;
  }

  const buckets = [
    p?.attribute_values, p?.options, p?.specs, p?.properties,
    p?.attribute_groups, p?.configurable_options, p?.configurableAttributes,
    p?.variation_attributes, p?.attributeOptions, p?.meta?.attributes, p?.meta?.options
  ].filter(Boolean);

  for (const g of buckets as any[]) {
    const list = Array.isArray(g) ? g : [];
    for (const it of list) {
      let vals: any =
        it?.values ?? it?.options ?? it?.items ?? it?.choices ?? it?.allowed_values ??
        it?.value ?? it?.value_name ?? null;
      if (typeof vals === "string") {
        const parts = vals.split(/[,،|/]/).map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) return true;
      } else if (Array.isArray(vals) && vals.filter(Boolean).length > 1) {
        return true;
      }
    }
  }
  return false;
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
      <div className="flex overflow-x-auto overscroll-x-contain snap-x snap-proximity gap-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
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

/* ==================== Quick View ==================== */
function ProductQuickView({
  open,
  loading,
  product,
  qty,
  onQtyChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  product: Product | null;
  qty: number;
  onQtyChange: (n: number) => void;
  onClose: () => void;
  onConfirm: (id: number, qty: number, attrs?: AttrPair[], unitPrice?: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [picked, setPicked] = useState<SelectedAttrs>({});

  const allAttrsChosen = useMemo(() => {
    const a = product?.attributes;
    if (!Array.isArray(a) || a.length === 0) return true;
    const reqNames = Array.from(new Set((a as AV[]).map((x) => x.attribute || "ویژگی")));
    return reqNames.every((name) => !!picked[name]);
  }, [product?.attributes, picked]);

  const selectedVariant: Variant | null = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    const keys = Object.keys(picked || {});
    const pref = ["size", "سایز", "اندازه", "maat", "尺码"].map((s) => s.toLowerCase());
    const chosenKey = keys.find((k) => pref.includes(k.toLowerCase())) ?? keys[0];
    const chosen = chosenKey ? picked[chosenKey] : null;
    if (!chosen) return null;
    return product.variants.find((v) => v.size?.id === chosen.id) || null;
  }, [product?.variants, picked]);

  const unitPrice = useMemo(() => {
    if (selectedVariant) return toNum(selectedVariant.price);
    const p = product?.discount_price ?? product?.price ?? 0;
    return toNum(p);
  }, [selectedVariant, product?.discount_price, product?.price]);

  const imgs = (Array.isArray(product?.images) ? product!.images! : []).filter(Boolean);
  const mainImg =
    absolutizeMedia((product as any)?.image || (product as any)?.thumbnail || imgs[0] || undefined) ||
    "/placeholder.svg";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-y-contain touch-pan-y"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white ring-1 ring-zinc-200 shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white/95 backdrop-blur">
            <h3 className="text-base md:text-lg font-extrabold text-zinc-900">
              {product?.title || product?.name || "محصول"}
            </h3>
            <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full bg-zinc-100 text-zinc-700" aria-label="بستن">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71 12 12l-6.29-6.29-1.42 1.42L10.59 13.4l-6.3 6.29 1.42 1.42L12 14.83l6.29 6.28 1.42-1.41-6.3-6.3 6.3-6.29z"/></svg>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-zinc-500">در حال بارگذاری اطلاعات…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-5 p-4">
              <div className="min-w-0">
                <div
                  className="prose prose-sm max-w-none mb-3 break-words [&_*]:!max-w-full text-zinc-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: String(product?.description || "") }}
                />

                {Array.isArray(product?.attributes) && product!.attributes!.length > 0 && (
                  <div className="mt-2">
                    <AttributePicker attributes={product!.attributes as AV[]} selected={picked} onChange={setPicked} />
                    {!allAttrsChosen && (
                      <div className="mt-2 text-xs text-amber-600">
                        لطفاً ویژگی‌های موردنیاز (سایز/رنگ) را انتخاب کنید.
                      </div>
                    )}
                    {selectedVariant && (selectedVariant.stock ?? 0) <= 0 && (
                      <div className="mt-2 text-xs text-red-600">ناموجود برای این انتخاب</div>
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <label className="text-xs text-zinc-600">تعداد</label>
                  <input
                    type="number" min={1} value={qty}
                    onChange={(e) => onQtyChange(Math.max(1, Number(e.target.value) || 1))}
                    className="h-9 w-20 rounded-lg border border-zinc-300 px-2 text-sm text-zinc-800"
                  />
                  <div className="ms-auto text-sm font-extrabold text-zinc-900">
                    {unitPrice.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 pb-2">
                  <button
                    disabled={
                      !allAttrsChosen ||
                      (!!selectedVariant && ((selectedVariant.stock ?? 0) <= 0))
                    }
                    onClick={() => {
                      if (!product?.id) return;
                      const attrs: AttrPair[] = Object.values(picked).map((v) => ({
                        name: v?.attribute, value: v?.value,
                      }));
                      const detail: any = {
                        productId: Number(product.id),
                        quantity: qty,
                        attributes: attrs,
                        unitPrice,
                      };
                      if (selectedVariant?.id != null) detail.variantId = selectedVariant.id;
                      document.dispatchEvent(new CustomEvent("bundle:addItemFromQuickView", { detail }));
                      onClose();
                    }}
                    className={`h-10 rounded-xl px-4 text-sm font-bold text-white ${
                      (!allAttrsChosen || (selectedVariant && (selectedVariant.stock ?? 0) <= 0))
                        ? "bg-pink-300 cursor-not-allowed"
                        : "bg-pink-600 hover:bg-pink-700"
                    }`}
                  >
                    افزودن به انتخاب باندل
                  </button>
                  <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-700 bg-white">
                    انصراف
                  </button>
                </div>
              </div>

              <div className="order-first md:order-last">
                <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden ring-1 ring-zinc-200">
                  <Image src={mainImg} alt={product?.title || product?.name || "محصول"} fill className="object-cover" sizes="(min-width:768px) 300px, 100vw" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== Page ==================== */
export default function BundleDetailPage() {
  const params = useParams() as { slug?: string } | null;
  const router = useRouter();
  const slug = (params?.slug ?? "").trim();

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [active, setActive] = useState(0);

  const [summary, setSummary] = useState({ total: 0, subtotal: 0, discountAmount: 0, selectedCount: 0, selectedQty: 0 });
  const handleSummaryChange = useCallback((s: typeof summary) => setSummary(s), []);

  const [productsFull, setProductsFull] = useState<Product[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  // Quick View state
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [quickQty, setQuickQty] = useState(1);

  // دریافت باندل
  useEffect(() => {
    let alive = true;
    (async () => {
      // اگر هنوز slug نرسیده، صبرِ یک رندر
      if (!slug) { setLoading(true); return; }

      setLoading(true); setErr(null);
      try {
        const data = await fetchBundleAny(slug);
        if (!alive) return;
        if (data) {
          setBundle(data);
          // اگر API اسلاگِ نُرمال برگرداند، URL را اصلاح کنیم
          if (data.slug && slug !== data.slug) router.replace(`/bundle/${encodeURIComponent(data.slug)}`);
        } else {
          setErr("not_found");
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "not_found");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, router]);

  // اگر bundle.products گزینهٔ انتخابی نداشت، محصول کامل را fetch کن
  useEffect(() => {
    (async () => {
      if (!bundle) return;

      const alreadyHasSelectable =
        Array.isArray(bundle.products) &&
        bundle.products.some((p: any) => hasSelectableOptions(p));

      if (alreadyHasSelectable) {
        setProductsFull([]);
        return;
      }

      const items = normalizeBundleItems(bundle);
      if (!items.length) {
        setProductsFull([]);
        return;
      }

      const out: Product[] = [];
      for (const it of items) {
        const p = await fetchProductAny(String(it.productId));
        if (p) out.push(p as Product);
      }
      setProductsFull(out);
    })();
  }, [bundle]);

  const name = bundle?.title || bundle?.name || "ست محصولات";

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

  // Quick View helpers
  const openQuickView = useCallback(async (productId: number) => {
    setQuickLoading(true);
    setQuickQty(1);
    try {
      const fromFull = productsFull.find((p) => Number(p.id) === Number(productId));
      const fromBundle = (bundle?.products || []).find((p: any) => Number(p?.id) === Number(productId)) as Product | undefined;
      const p = fromFull || fromBundle || (await fetchProductAny(String(productId)));
      setQuickProduct(p || null);
      setQuickOpen(true);
    } finally {
      setQuickLoading(false);
    }
  }, [productsFull, bundle]);

  const closeQuickView = useCallback(() => {
    setQuickOpen(false);
    setTimeout(() => setQuickProduct(null), 200);
  }, []);

  if (loading)
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">در حال بارگذاری…</main>;

  // 🔻 حالت خالیِ تمیز، به‌جای «خطا: باندل پیدا نشد»
  if (err === "not_found" || !bundle) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16" dir="rtl">
        <div className="rounded-2xl border border-zinc-200 p-8 text-center">
          <h1 className="mb-2 text-2xl font-extrabold text-zinc-900">باندل پیدا نشد</h1>
          <p className="text-zinc-600 mb-6">
            باندلی با این کُد/اسلاگ وجود ندارد یا ممکن است حذف شده باشد.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/bundles" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
              مشاهده همهٔ باندل‌ها
            </Link>
            <Link href="/" className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90">
              بازگشت به صفحهٔ اصلی
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8 touch-pan-y" dir="rtl">
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
                onRequestPreview={openQuickView}
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

      {/* Video modal */}
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} video={videos[videoIndex] ?? null} />

      <ProductQuickView
        open={quickOpen}
        loading={quickLoading}
        product={quickProduct}
        qty={quickQty}
        onQtyChange={setQuickQty}
        onClose={closeQuickView}
        onConfirm={() => {}}
      />
    </main>
  );
}
