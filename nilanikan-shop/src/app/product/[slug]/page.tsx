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
import CardSlider from "@/components/CardSlider";

/* ================= Types ================= */
type SizeChart = {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
};

type Variant = { id: number; size: AV; price: number; stock: number };

type VideoItem = {
  id: number;
  title?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  order?: number;
  is_primary?: boolean;
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
  videos?: VideoItem[] | null;
  attributes?: AV[] | Record<string, any> | null;
  size_chart?: SizeChart | null;
  category?: string | number | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  variants?: Variant[] | null;
  stock?: number | null;
  [k: string]: any;
};

/* ================= Helpers ================= */
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

function isExternalVideo(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be") || u.includes("aparat.com") || u.includes("vimeo.com");
}
function toEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw); const host = u.hostname.replace(/^www\./, "");
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
  } catch { return null; }
}

/* ================= UI: Video Modal ================= */
function VideoModal({
  open, onClose, video,
}: { open: boolean; onClose: () => void; video: VideoItem | null }) {
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
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="بستن ویدیو"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-zinc-800 shadow focus:outline-none"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="currentColor" d="M18.3 5.71L12 12.01l-6.29-6.3-1.42 1.42L10.59 13.4l-6.3 6.29 1.42 1.42 6.29-6.3 6.29 6.3 1.42-1.42-6.3-6.29 6.3-6.29z"/>
        </svg>
      </button>
      <div
        className="absolute inset-0 grid place-items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-zinc-700">
          {isExt ? (
            <iframe
              title={video.title || "video"}
              src={src || undefined}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            />
          ) : (
            <video key={src || ""} src={src || ""} controls playsInline className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Galleries ================= */
function MobileGallery({
  images, alt, onVideoClick, showVideoBtn,
}: { images: string[]; alt: string; onVideoClick: () => void; showVideoBtn: boolean }) {
  return (
    <div className="lg:hidden relative">
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

      {showVideoBtn && (
        <button
          onClick={onVideoClick}
          className="absolute right-3 top-3 h-11 w-11 grid place-items-center rounded-full bg-black/55 text-white shadow-md"
          aria-label="ویدیو"
          title="ویدیو"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </button>
      )}
    </div>
  );
}

function DesktopGallery({
  images, alt, active, setActive, onVideoClick, showVideoBtn,
}: {
  images: string[]; alt: string; active: number; setActive: (i: number) => void;
  onVideoClick: () => void; showVideoBtn: boolean;
}) {
  const main = images[active] || images[0] || "/placeholder.svg";
  return (
    <div className="hidden lg:block">
      <div className="relative">
        <div className="grid grid-cols-[80px_1fr] gap-4">
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

          <div className="relative w-full h-[520px] rounded-2xl ring-1 ring-zinc-200 overflow-hidden">
            <Image src={main || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="520px" priority />
          </div>
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          {showVideoBtn && (
            <button
              onClick={onVideoClick}
              className="h-10 w-10 grid place-items-center rounded-full bg-white/90 text-zinc-800 ring-1 ring-zinc-200 shadow hover:bg-white"
              aria-label="مشاهده ویدیو"
              title="مشاهده ویدیو"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Page ================= */
export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const [videoOpen, setVideoOpen] = useState(false);
  const [picked, setPicked] = useState<SelectedAttrs>({});

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
    return () => { alive = false; };
  }, [slug, router]);

  const pickedSummary = useMemo(() => {
    const entries = Object.entries(picked).filter(([, v]) => !!v);
    if (!entries.length) return "";
    return " (" + entries.map(([, v]) => `${v!.attribute}: ${v!.value}`).join(", ") + ")";
  }, [picked]);

  const allAttrsChosen = useMemo(() => {
    const a = product?.attributes;
    if (!Array.isArray(a) || a.length === 0) return true;
    const reqNames = Array.from(new Set((a as AV[]).map((x) => x.attribute || "ویژگی")));
    return reqNames.every((name) => !!picked[name]);
  }, [product?.attributes, picked]);

  // توضیحات HTML
  const descriptionHtml = useMemo(() => {
    const raw = product?.description ?? "";
    const looksLikeHtml = /<\w+[^>]*>/.test(raw);
    return looksLikeHtml ? raw : toDescriptionHtml(raw);
  }, [product?.description]);

  /* ====== شرط اعمال تغییر (فقط برای اسلاگ‌های مشخص) ====== */
  const targetSlugs = new Set(["lds"]); // اسلاگ‌هایی که می‌خواهی تغییر رویشان اعمال شود
  const isTarget = targetSlugs.has((product?.slug ?? slug)?.toLowerCase());

  // تب توضیحات را برای هدف خالی می‌کنیم
  const adjustedDescription = isTarget ? "" : descriptionHtml;

  // توضیحات را به note جدول سایز منتقل می‌کنیم
  const adjustedSizeChart: SizeChart | null = useMemo(() => {
    if (!isTarget) return product?.size_chart ?? null;

    const moved = (product?.description ?? "").trim(); // می‌توانی descriptionHtml بگذاری
    const base: SizeChart = product?.size_chart
      ? { ...product.size_chart }
      : { headers: [], rows: [] };

    const oldNote = (base.note ?? "").trim();
    const sep = oldNote && moved ? "\n\n" : "";
    return { ...base, note: `${oldNote}${sep}${moved}` };
  }, [isTarget, product?.size_chart, product?.description]);

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

  // Variant انتخاب‌شده
  const selectedVariant: Variant | null = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    const keys = Object.keys(picked || {});
    const pref = ["size", "سایز", "اندازه", "maat", "尺码"].map((s) => s.toLowerCase());
    const chosenKey = keys.find((k) => pref.includes(k.toLowerCase())) ?? keys[0];
    const chosen = chosenKey ? picked[chosenKey] : null;
    if (!chosen) return null;
    return product.variants.find((v) => v.size?.id === chosen.id) || null;
  }, [product?.variants, picked]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.price);
    return Number(product?.discount_price ?? product?.price ?? 0);
  }, [selectedVariant, product?.discount_price, product?.price]);

  const variantInStock = selectedVariant ? (selectedVariant.stock ?? 0) > 0 : true;
  const stockLeft = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.stock ?? 0);
    return product?.stock != null ? Number(product.stock) : null;
  }, [selectedVariant, product?.stock]);

  const canShowStock =
    (hasSize ? sizePicked : true) && (hasColor ? colorPicked : true) && stockLeft != null;

  const guidanceMessage = useMemo(() => {
    if (hasSize && sizePicked && hasColor && !colorPicked) return "لطفاً رنگ را انتخاب کنید.";
    if (hasColor && colorPicked && hasSize && !sizePicked) return "لطفاً سایز را انتخاب کنید.";
    return null;
  }, [hasSize, hasColor, sizePicked, colorPicked]);

  // ویژگی‌ها برای تب
  const featureLines = useMemo(() => {
    const attrs = Array.isArray(product?.attributes) ? (product!.attributes as AV[]) : [];
    if (!attrs.length) return [] as string[];
    const lines = attrs
      .map((a) => {
        const label = String(a.attribute || "").trim();
        const value = String(a.value || "").trim();
        if (!label && !value) return null;
        return `${label}${value ? `: ${value}` : ""}`;
      })
      .filter(Boolean) as string[];
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

  // محصولات مشابه
  function toProductCardItem(r: any) {
    const title =
      String(
        r.title ?? r.name ?? r.product_name ?? r.productTitle ?? r.label ?? r.caption ??
        r._raw?.title ?? r._raw?.name ?? r._raw?.name_fa ?? r._raw?.title_fa ?? `محصول ${r?.id ?? ""}`
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
        const cat =
          product.category_slug || product.categorySlug || product.category ||
          product.categoryName || product.category_name;
        const q1 = cat
          ? `${endpoints.products}?limit=20&category=${encodeURIComponent(String(cat))}`
          : `${endpoints.products}?limit=20`;
        let raw = await get<any>(q1, { throwOnHTTP: false, fallback: { results: [] } });
        let arr = listify(raw).filter((p: any) => String(p.id) !== String(product.id));
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
    return () => { alive = false; };
  }, [product]);

  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">در حال بارگذاری…</main>;
  }
  if (err || !product) {
    return <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">خطا: {err || "محصول پیدا نشد."}</main>;
  }

  // تصاویر
  const galleryRaw: string[] = [
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.gallery) ? product.gallery.map((g) => g.image) : []),
    ...(product.image ? [product.image] : []),
  ];
  const images: string[] = galleryRaw.map((g, i) =>
    resolveImage(g, (product.slug || String(product.id)) + "_" + i)
  );

  // ویدیوها
  const videos: VideoItem[] = (() => {
    const list = Array.isArray(product?.videos) ? (product!.videos as any[]) : [];
    return list
      .filter((v: any): v is VideoItem => !!v && !!v.url)
      .map((v: any) => ({
        ...v,
        url: absolutizeMedia(v.url) || v.url,
        thumbnailUrl:
          absolutizeMedia(v.thumbnailUrl || undefined) || v.thumbnailUrl || null,
        order: v.order ?? 0,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  })();

  const showVideoBtn = videos.length > 0;

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
          <MobileGallery
            images={images}
            alt={product.name}
            showVideoBtn={showVideoBtn}
            onVideoClick={() => setVideoOpen(true)}
          />
          <DesktopGallery
            images={images}
            alt={product.name}
            active={active}
            setActive={setActive}
            showVideoBtn={showVideoBtn}
            onVideoClick={() => setVideoOpen(true)}
          />

          <ProductReviewSummary
            productId={product.id}
            productSlug={product.slug || String(product.id)}
            className="mt-3"
          />
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
                {toFa(Number(displayPrice))} <span className="text-sm">تومان</span>
              </div>
            </div>

            {/* انتخاب ویژگی‌ها */}
            {Array.isArray(product.attributes) && product.attributes.length > 0 && (
              <div className="mt-4">
                <AttributePicker attributes={product.attributes as AV[]} selected={picked} onChange={setPicked} />

                {guidanceMessage && (
                  <div className="mt-2 text-xs font-medium text-amber-600">{guidanceMessage}</div>
                )}
                {!guidanceMessage && !allAttrsChosen && (
                  <div className="mt-2 text-xs text-amber-600">لطفاً ویژگی‌های موردنیاز (سایز/رنگ) را انتخاب کنید.</div>
                )}

                {canShowStock && (
                  <div
                    className={`mt-2 text-sm ${(stockLeft ?? 0) <= 3 ? "text-rose-600" : "text-emerald-700"}`}
                  >
                    {(stockLeft ?? 0) > 0 ? `تنها ${toFa(stockLeft!)} عدد باقی‌مانده` : "ناموجود"}
                  </div>
                )}

                {selectedVariant && !(selectedVariant.stock ?? 0) && (
                  <div className="mt-2 text-xs text-red-600">ناموجود برای این انتخاب</div>
                )}
              </div>
            )}

            {/* Add to cart */}
            <div className={`mt-4 ${allAttrsChosen && variantInStock ? "" : "pointer-events-none opacity-60"}`}>
              <AddToCartButton
                id={Number(product.id)}
                price={Number(displayPrice)}
                name={product.name + pickedSummary}
                image={images[0] || "/placeholder.svg"}
                className="h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700"
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
  showFeatures={false}   // 👈 تب ویژگی‌ها حذف می‌شود
  features={featureLines}
  description={adjustedDescription}
  sizeChart={adjustedSizeChart}
  reviewsEnabled={true}
  productId={product.id}
  productSlug={product.slug || String(product.id)}
  initialTab="description"
/>

      </section>

      {/* Related products */}
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

      {/* ویدیو فقط در مودال */}
      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        video={videos[0] ?? null}
      />
    </main>
  );
}
