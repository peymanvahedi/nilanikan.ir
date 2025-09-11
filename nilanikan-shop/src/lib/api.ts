// src/lib/api.ts
// ───────────────────────────────────────────────────────────
// 🔧 تنظیم پایه API و اندپوینت‌ها
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000")
  .replace(/\/+$/, "");

export const endpoints = {
  home: "/api/home/",
  bundles: "/api/bundles/",
  products: "/api/products/",
  categories: "/api/categories/",
};

// ───────────────────────────────────────────────────────────
// 🧩 ابزارهای کمکی عمومی
export function buildQuery(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function ensurePath(p: string) {
  return p.startsWith("/") ? p : `/${p}`;
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(ensurePath(path), API_BASE).toString();
}

class ApiError extends Error {
  status?: number;
  url?: string;
  payload?: any;
  constructor(o: { message: string; status?: number; url?: string; payload?: any }) {
    super(o.message);
    this.status = o.status;
    this.url = o.url;
    this.payload = o.payload;
  }
}

// یک fetch با timeout + credentials + JSON fallback
async function _fetch(url: string, init: RequestInit = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000); // 15s
  try {
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json", ...(init.headers || {}) },
      signal: ctrl.signal,
      ...init,
    });

    if (!res.ok) {
      const payload = await res.text().catch(() => "");
      throw new ApiError({
        message: payload || res.statusText,
        status: res.status,
        url,
        payload,
      });
    }

    if (res.status === 204) return null;

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } finally {
    clearTimeout(timer);
  }
}

// ───────────────────────────────────────────────────────────
// GET / POST / DELETE
export async function get<T = any>(
  path: string,
  opts?: { throwOnHTTP?: boolean; fallback?: any; init?: RequestInit }
): Promise<T> {
  const url = buildUrl(path);
  try {
    return (await _fetch(url, { method: "GET", ...(opts?.init || {}) })) as T;
  } catch (e: any) {
    if (opts?.throwOnHTTP === false) return (opts?.fallback ?? null) as T;
    throw e;
  }
}

type ReqOpts = { throwOnHTTP?: boolean; fallback?: any; init?: RequestInit };

async function request<T = any>(method: string, path: string, body?: any, opts?: ReqOpts): Promise<T> {
  const url = buildUrl(path);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const init: RequestInit = {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(opts?.init?.headers || {}),
    },
    body:
      body === undefined
        ? undefined
        : isFormData
        ? body
        : typeof body === "string"
        ? body
        : JSON.stringify(body),
    ...(opts?.init || {}),
  };

  try {
    return (await _fetch(url, init)) as T;
  } catch (e: any) {
    if (opts?.throwOnHTTP === false) return (opts?.fallback ?? null) as T;
    throw e;
  }
}

export async function post<T = any>(path: string, body?: any, opts?: ReqOpts): Promise<T> {
  return request<T>("POST", path, body, opts);
}
export async function del<T = any>(path: string, opts?: ReqOpts): Promise<T> {
  return request<T>("DELETE", path, undefined, opts);
}

// ───────────────────────────────────────────────────────────
// 🖼️ Media helpers
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");
const MEDIA_PREFIX = (process.env.NEXT_PUBLIC_MEDIA_PREFIX ?? "/media/").replace(/\/?$/, "/");

export function toMedia(filePath: string): string {
  if (!filePath) return "";
  const clean = String(filePath).replace(/^\/+/, "");
  if (MEDIA_BASE) return `${MEDIA_BASE}${MEDIA_PREFIX}${clean}`;
  return `${MEDIA_PREFIX}${clean}`;
}

export function absolutizeMedia(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const path = url.startsWith("/") ? url : `/${url}`;
  if (path.startsWith(MEDIA_PREFIX)) {
    return MEDIA_BASE ? `${MEDIA_BASE}${path}` : path;
  }
  return toMedia(path.replace(/^\//, ""));
}

// ───────────────────────────────────────────────────────────
// 🏠 Home payload + نرمالایزرها و فالبک‌ها
type HomePayload = {
  stories?: any[];
  vip?: { endsAt?: string; products?: any[]; seeAllLink?: string };
  setsAndPuffer?: { items?: any[] };
  miniLooks?: any[];
  bestSellers?: any[];
  banners?: any[];
  newArrivals?: any[];
  heroSlides?: any[];
};

type AnyList<T = any> = { results?: T[] } | T[] | null | undefined;
const listify = <T = any>(x: AnyList<T>): T[] =>
  Array.isArray(x) ? x : Array.isArray((x as any)?.results) ? (x as any).results : [];

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const num = (v: any): number => {
  if (v == null || v === "") return 0;
  let raw = String(v);
  const isRial = /ریال/i.test(raw);
  raw = toEnglishDigits(raw);
  const cleaned = raw.replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return isRial ? Math.round(n / 10) : n; // ریال → تومان
};

const pick = (...cands: any[]) => cands.find((x) => x !== undefined && x !== null && x !== "");

// نرمالایزر محصول
function normalizeAnyProduct(it: any) {
  const img = pick(
    it?.imageUrl,
    it?.image,
    it?.thumbnail,
    it?.main_image,
    it?.cover,
    it?.photo?.url,
    it?.images?.[0]?.url,
    it?.media?.main?.url,
    it?.pictures?.[0],
    it?.gallery?.[0]
  );

  const rawPrice = pick(
    it?.bundle_price,
    it?.bundlePrice,
    it?.price,
    it?.final_price,
    it?.total_price,
    it?.amount,
    it?.min_price,
    it?.minPrice,
    it?.regular_price,
    it?.price_toman,
    it?.toman_price,
    it?.price_ir,
    it?.price_irr,
    it?.price_rial
  );
  const rawDiscount = pick(
    it?.bundle_discount_price,
    it?.bundleDiscountPrice,
    it?.discount_price,
    it?.discounted_price,
    it?.sale_price,
    it?.off_price,
    it?.special_price
  );

  const price0 = num(rawPrice);
  const discount0 = rawDiscount != null ? num(rawDiscount) : undefined;

  const price = price0 || (discount0 ?? 0);
  const discount_price = discount0;

  return {
    id: it?.id ?? it?.pk ?? it?.slug ?? Math.random().toString(36).slice(2),
    slug: it?.slug ?? String(it?.id ?? ""),
    name: it?.name ?? it?.title ?? "بدون نام",
    price,
    discount_price,
    imageUrl: absolutizeMedia(img || ""),
    _raw: it,
  };
}

// 🔹 نرمالایزرهای شفاف برای اسلاید و بنر
function normalizeSlide(s: any, i: number) {
  return {
    id: s?.id ?? i,
    imageUrl: absolutizeMedia(s?.imageUrl ?? s?.image ?? ""),
    link: s?.link ?? s?.href ?? undefined,
    alt: s?.alt ?? s?.title ?? `slide ${i + 1}`,
    title: s?.title ?? undefined,
  };
}

function normalizeBanner(b: any, i: number) {
  return {
    id: b?.id ?? i,
    title: b?.title ?? "",
    subtitle: b?.subtitle ?? null,
    imageUrl: absolutizeMedia(b?.imageUrl ?? b?.image ?? ""),
    link: b?.link ?? b?.href ?? null,
  };
}

const HOME_FALLBACK: HomePayload = {
  stories: [],
  vip: { endsAt: "", products: [], seeAllLink: "/vip" },
  setsAndPuffer: { items: [] },
  miniLooks: [],
  bestSellers: [],
  banners: [],
  newArrivals: [],
  heroSlides: [],
};

// کمک‌تابع: تشخیص truthy برای فلگ‌های متنی/عددی
function truthyFlag(v: any): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "true" || t === "1" || t === "yes" || t === "on";
  }
  return false;
}

export async function fetchHome(): Promise<HomePayload> {
  const base = await get<HomePayload>(endpoints.home, {
    throwOnHTTP: false,
    fallback: HOME_FALLBACK,
  });

  const out: HomePayload = { ...HOME_FALLBACK, ...(base || {}) };

  // 1) ست‌ها و پافر (اگر خالی بود از باندل‌ها پُر کن)
  const currentItems = listify(out.setsAndPuffer?.items);
  if (!currentItems.length) {
    const bundles = await get<any>(`${endpoints.bundles}?limit=20`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    const items = listify(bundles).map(normalizeAnyProduct);
    out.setsAndPuffer = { items };
  }

  // 2) VIP products — فقط محصولات با is_recommended=1
  //    الف) اگر /api/home/ خودش vip.products داد، ابتدا همان را فیلتر می‌کنیم
  const vipRawFromHome = listify(out.vip?.products);
  let vipFiltered = vipRawFromHome.filter((p: any) => truthyFlag(p?.is_recommended));
  //    ب) اگر چیزی پیدا نشد، مستقیم از /api/products/?is_recommended=1 می‌گیریم
  if (!vipFiltered.length) {
    const rec = await get<any>(`${endpoints.products}?is_recommended=1&limit=12`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    vipFiltered = listify(rec).filter((p: any) => truthyFlag(p?.is_recommended));
  }
  //    هیچ فالبک دیگری (مثل جدیدترین‌ها) نداریم
  const vipProducts = vipFiltered.map(normalizeAnyProduct);
  out.vip = {
    endsAt: out.vip?.endsAt || "",
    seeAllLink: out.vip?.seeAllLink || "/vip",
    products: vipProducts,
  };

  // 3) Best sellers فالبک از پرموجودی/پرفروش (حدسی: stock)
  let best = listify(out.bestSellers).map(normalizeAnyProduct);
  if (!best.length) {
    const bs = await get<any>(`${endpoints.products}?ordering=-stock,-id&limit=12`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    best = listify(bs).map(normalizeAnyProduct);
  }
  out.bestSellers = best;

  // 4) New arrivals فالبک از جدیدترین‌ها
  let latest = listify(out.newArrivals).map(normalizeAnyProduct);
  if (!latest.length) {
    const na = await get<any>(`${endpoints.products}?ordering=-created_at&limit=12`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    latest = listify(na).map(normalizeAnyProduct);
  }
  out.newArrivals = latest;

  // 5) Slides/Banners — هر کدام خالی بود، تکی فچ کن (بدون قاطی کردن)
  let slides = listify(out.heroSlides).map(normalizeSlide);
  if (!slides.length) {
    const resp = await get<any>(`${endpoints.home.replace("/home/", "")}slides/`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    slides = listify(resp).map(normalizeSlide);
  }
  out.heroSlides = slides;

  let banners = listify(out.banners).map(normalizeBanner);
  if (!banners.length) {
    const resp = await get<any>(`${endpoints.home.replace("/home/", "")}banners/`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    banners = listify(resp).map(normalizeBanner);
  }
  out.banners = banners;

  // 6) سایر فیلدها
  out.miniLooks = listify(out.miniLooks);
  out.stories   = listify(out.stories);

  return out;
}
