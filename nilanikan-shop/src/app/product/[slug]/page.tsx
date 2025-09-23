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
  AttributeValue as AV, // گروه ویژگی‌ها برای AttributePicker (attribute + values[])
} from "@/components/AttributePicker";
import ProductReviewSummary from "@/components/ProductReviewSummary";
import CardSlider from "@/components/CardSlider";
import Breadcrumbs from "@/components/Breadcrumbs";

/* ================= Types ================= */
type SizeChart = {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
};

// مقدارِ API برای یک AttributeValue روی واریانت‌ها
type AttrValApi = {
  id: number;
  attribute?: string | null;
  value?: string | null;
  slug?: string | null;
  color_code?: string | null;
  label?: string | null;
};

type Variant = {
  id: number;
  size?: AttrValApi | null;
  color?: AttrValApi | null;
  price: number;
  stock: number;
};

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
  price?: number | null;
  discount_price?: number | null;
  brand?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[];
  gallery?: { id: number; image: string; alt?: string | null }[];
  videos?: VideoItem[] | null;
  // attributes به‌صورت گروهی: [{attribute:"رنگ", values:[...]}]
  attributes?: AV[] | null;
  size_chart?: SizeChart | null;
  category?: string | number | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  variants?: Variant[] | null;
  stock?: number | null;

  // راهنمای سایز
  meta?: Record<string, any> | null;
  size_guide_html?: string | null;
  size_guide_url?: string | null;
  size_chart_image?: string | null;

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

/* ====== برای بردکرامب: واکشی نام/اسلاگ دسته در صورت نبود روی محصول ====== */
type CategoryMini = { slug?: string | null; name?: string | null; title?: string | null };

async function fetchCategoryByIdOrSlug(idOrSlug: string | number): Promise<CategoryMini | null> {
  const direct = await get<any>(`${endpoints.categories}${encodeURIComponent(String(idOrSlug))}/`, {
    throwOnHTTP: false,
  });
  if (direct && !direct?.detail) {
    return { slug: direct.slug ?? null, name: direct.name ?? direct.title ?? null };
  }

  const qs = /^\d+$/.test(String(idOrSlug)) ? `id=${idOrSlug}` : `slug=${encodeURIComponent(String(idOrSlug))}`;
  const res = await get<any>(`${endpoints.categories}?${qs}&limit=1`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });
  const item = Array.isArray(res) ? res[0] : (Array.isArray(res?.results) ? res.results[0] : null);
  if (!item) return null;
  return { slug: item.slug ?? null, name: item.name ?? item.title ?? null };
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

/* ============== Size Guide Modal (inline) ============== */
function SizeGuideModal({
  open,
  onClose,
  title,
  html,
  imageUrl,
  linkUrl,
}: {
  open: boolean;
  onClose: () => void;
  title?: string | null;
  html?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        className="absolute inset-0 grid place-items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white ring-1 ring-zinc-200 shadow-xl">
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-white">
            <h3 className="text-base md:text-lg font-extrabold text-zinc-900">
              {title || "راهنمای سایز"}
            </h3>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-full bg-zinc-100 text-zinc-700"
              aria-label="بستن"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.3 5.71 12 12l-6.29-6.29-1.42 1.42L10.59 13.4l-6.3 6.29 1.42 1.42L12 14.83l6.29 6.28 1.42-1.41-6.3-6.3 6.3-6.29z"
                />
              </svg>
            </button>
          </div>

          <div className="p-4">
            {html ? (
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
            ) : null}

            {imageUrl ? (
              <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-zinc-200">
                <img src={imageUrl} alt="راهنمای سایز" className="w-full h-auto" />
              </div>
            ) : null}

            {linkUrl && !html && !imageUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-pink-700 hover:underline"
              >
                مشاهده راهنمای سایز
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3Z" />
                  <path fill="currentColor" d="M5 5h5V3H3v7h2V5Z" />
                </svg>
              </a>
            ) : null}

            {!html && !imageUrl && !linkUrl ? (
              <div className="text-sm text-zinc-500">راهنمای سایزی ثبت نشده است.</div>
            ) : null}
          </div>
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
  const [sizeOpen, setSizeOpen] = useState(false);

  const [related, setRelated] = useState<any[]>([]);
  const [relLoading, setRelLoading] = useState(false);

  const [catCrumb, setCatCrumb] = useState<{ href?: string; label: string } | null>(null);

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

  const descriptionHtml = useMemo(() => {
    const raw = product?.description ?? "";
    const looksLikeHtml = /<\w+[^>]*>/.test(raw);
    return looksLikeHtml ? raw : toDescriptionHtml(raw);
  }, [product?.description]);

  /* ====== نمونه‌ی هدف برای انتقال توضیحات به تب سایز (اختیاری) ====== */
  const targetSlugs = new Set(["lds"]);
  const isTarget = targetSlugs.has((product?.slug ?? slug)?.toLowerCase());
  const adjustedDescription = isTarget ? "" : descriptionHtml;
  const adjustedSizeChart: SizeChart | null = useMemo(() => {
    if (!isTarget) return product?.size_chart ?? null;
    const moved = (product?.description ?? "").trim();
    const base: SizeChart = product?.size_chart
      ? { ...product.size_chart }
      : { headers: [], rows: [] };
    const oldNote = (base.note ?? "").trim();
    const sep = oldNote && moved ? "\n\n" : "";
    return { ...base, note: `${oldNote}${sep}${moved}` };
  }, [isTarget, product?.size_chart, product?.description]);

  // شناسایی سایز/رنگ از روی گروه‌های attributes
  const { hasSize, hasColor, sizePicked, colorPicked } = useMemo(() => {
    const groups = Array.isArray(product?.attributes) ? (product!.attributes as AV[]) : [];
    const names = groups.map((g) => (g.attribute || "").toLowerCase());
    const sizeKeys = ["size", "سایز", "اندازه", "maat", "尺码"].map((s) => s.toLowerCase());
    const colorKeys = ["color", "رنگ", "colour", "لون"].map((s) => s.toLowerCase());
    const hasSize = names.some((n) => sizeKeys.includes(n));
    const hasColor = names.some((n) => colorKeys.includes(n));

    const pkeys = Object.keys(picked || {}).map((k) => k.toLowerCase());
    const sizePicked = pkeys.some((k) => sizeKeys.includes(k));
    const colorPicked = pkeys.some((k) => colorKeys.includes(k));

    return { hasSize, hasColor, sizePicked, colorPicked };
  }, [product?.attributes, picked]);

  // داده‌های راهنمای سایز
  const sizeGuideHtml =
    (product as any)?.size_guide_html ?? (product as any)?.meta?.size_guide_html ?? null;
  const sizeGuideUrlRaw =
    (product as any)?.size_guide_url ?? (product as any)?.meta?.size_guide_url ?? null;
  const sizeChartImgRaw =
    (product as any)?.size_chart_image ?? (product as any)?.meta?.size_chart_image ?? null;

  const sizeGuideUrl = sizeGuideUrlRaw
    ? (absolutizeMedia(sizeGuideUrlRaw) || sizeGuideUrlRaw)
    : null;
  const sizeChartImg = sizeChartImgRaw
    ? (absolutizeMedia(sizeChartImgRaw) || sizeChartImgRaw)
    : null;
  const hasSizeGuide = !!(sizeGuideHtml || sizeGuideUrl || sizeChartImg);

  // کمک‌تابع برای گرفتن id انتخاب‌شده
  const norm = (s: string) => s.trim().toLowerCase();
  const sizeKeys = ["size", "سایز", "اندازه", "maat", "尺码"].map(norm);
  const colorKeys = ["color", "رنگ", "colour", "لون"].map(norm);
  const getPickedId = (keys: string[]) => {
    for (const k of Object.keys(picked)) {
      if (keys.includes(norm(k))) return picked[k]?.id as number | string | undefined;
    }
    return undefined;
  };

  const sizeId = getPickedId(sizeKeys);
  const colorId = getPickedId(colorKeys);

  // فیلتر واریانت‌ها بر اساس انتخاب‌ها
  const variantCandidates: Variant[] = useMemo(() => {
    const vars = product?.variants || [];
    if (!Array.isArray(vars) || vars.length === 0) return [];
    return vars.filter((v) => {
      const okSize = sizeId ? v.size?.id === Number(sizeId) : true;
      const okColor = colorId ? v.color?.id === Number(colorId) : true;
      return okSize && okColor;
    });
  }, [product?.variants, sizeId, colorId]);

  // اگر هر دو انتخاب شده باشند باید دقیقاً یک واریانت باشد
  const selectedVariant: Variant | null = useMemo(() => {
    if (!variantCandidates.length) return null;
    if (sizeId || colorId) {
      // اگر هر دو انتخاب کامل‌اند، معمولاً 1 مورد است
      if (sizeId && colorId) return variantCandidates[0] || null;
      // اگر یکی انتخاب شده و فقط یک کاندید مانده
      if (variantCandidates.length === 1) return variantCandidates[0];
    }
    return null;
  }, [variantCandidates, sizeId, colorId]);

  // حداقل قیمت بین کاندیدها (برای وقتی که فقط یکی از ویژگی‌ها انتخاب شده)
  const candidatesMinPrice: number | undefined = useMemo(() => {
    if (!variantCandidates.length) return undefined;
    const prices = variantCandidates.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
    return prices.length ? Math.min(...prices) : undefined;
  }, [variantCandidates]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.price);
    if (candidatesMinPrice != null) return candidatesMinPrice;
    return Number(product?.discount_price ?? product?.price ?? 0);
  }, [selectedVariant, candidatesMinPrice, product?.discount_price, product?.price]);

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
    const groups = Array.isArray(product?.attributes) ? (product!.attributes as AV[]) : [];
    if (!groups.length) return [] as string[];
    const lines = groups.flatMap((g) => {
      const label = String(g.attribute || "").trim();
      return (g as any).values?.map((v: any) => {
        const value = String(v?.label ?? v?.value ?? "").trim();
        if (!label && !value) return null;
        return `${label}${value ? `: ${value}` : ""}`;
      }) ?? [];
    }).filter(Boolean) as string[];

    const sizeKeys2 = sizeKeys;
    const colorKeys2 = colorKeys;
    const score = (s: string) => {
      const low = s.toLowerCase();
      if (sizeKeys2.some((k) => low.startsWith(k))) return 0;
      if (colorKeys2.some((k) => low.startsWith(k))) return 1;
      return 2;
    };
    return [...lines].sort((a, b) => score(a) - score(b));
  }, [product?.attributes]);

  // محصولات مشابه
  function toProductCardItem(r: any) {
    const title =
      String(
        r.title ?? r.name ?? r.product_name ?? r.productTitle ?? r.label ?? r.caption ?? r._raw?.title ?? r._raw?.name ?? r._raw?.name_fa ?? r._raw?.title_fa ?? `محصول ${r?.id ?? ""}`
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

  // ➜ پر کردن بردکرامب دسته (اگر روی محصول ناقص باشد)
  useEffect(() => {
    if (!product) return;

    const rawSlug =
      product.category_slug ||
      product.categorySlug ||
      (typeof product.category === "string" ? product.category : null);
    const rawName = product.category_name || product.categoryName || null;

    if (rawSlug) {
      setCatCrumb({ href: `/category/${encodeURIComponent(String(rawSlug))}`, label: rawName || "محصولات" });
      return;
    }

    const idOrSlug = product.category ?? null;
    if (!idOrSlug) {
      setCatCrumb({ label: "محصولات" });
      return;
    }

    let alive = true;
    (async () => {
      try {
        const cat = await fetchCategoryByIdOrSlug(idOrSlug);
        if (!alive) return;
        if (cat?.slug) {
          setCatCrumb({ href: `/category/${encodeURIComponent(cat.slug)}`, label: cat.name || "محصولات" });
        } else {
          setCatCrumb({ label: cat?.name || "محصولات" });
        }
      } catch {
        if (alive) setCatCrumb({ label: "محصولات" });
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
    !!product.discount_price && Number(product.discount_price) < Number(product.price ?? 0);
  const discount =
    hasDiscount && product.discount_price && product.price
      ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
      : 0;

  const showSizeGuideButton =
    Array.isArray(product.attributes) &&
    (product.attributes as AV[]).length > 0 &&
    (product.attributes as AV[]).some(a =>
      String(a.attribute || "").toLowerCase().includes("size") || /سایز|اندازه/i.test(String(a.attribute || ""))
    ) &&
    hasSizeGuide;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      {/* --- Breadcrumbs لینک‌دار با دسته --- */}
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: "خانه", href: "/" },
          catCrumb || { label: "محصولات" },
          { label: product.name },
        ]}
      />

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

            {/* انتخاب ویژگی‌ها + دکمه راهنمای سایز */}
            {Array.isArray(product.attributes) && product.attributes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-zinc-700">انتخاب ویژگی‌ها</div>
                  {showSizeGuideButton && (
                    <button
                      type="button"
                      onClick={() => setSizeOpen(true)}
                      className="text-xs font-bold text-pink-700 hover:text-pink-800"
                    >
                      راهنمای سایز
                    </button>
                  )}
                </div>

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
          showFeatures={false}
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
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} video={videos[0] ?? null} />

      {/* مودال راهنمای سایز */}
      <SizeGuideModal
        open={sizeOpen}
        onClose={() => setSizeOpen(false)}
        title={`راهنمای سایز ${product.name}`}
        html={sizeGuideHtml}
        imageUrl={sizeChartImg}
        linkUrl={sizeGuideUrl}
      />
    </main>
  );
}
