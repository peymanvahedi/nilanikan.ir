/* ===================== BASE و مسیرها ===================== */

// 1) تلاش برای گرفتن BASE از env (ترجیح با فوروارد Codespaces)
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "";

// 2) نرمال‌سازی (حذف / انتهایی)
let ABS_BASE = (RAW_BASE || "").replace(/\/+$/, "");

// 3) اگر env نداشتی و روی کلاینت هستی، حدس دامنه Codespaces (3000 → 8000)
if (!ABS_BASE && typeof window !== "undefined") {
  const h = window.location.host; // مثل: abc-xyz-3000.app.github.dev
  if (/\.app\.github\.dev$/.test(h)) {
    ABS_BASE = `https://${h.replace(/-\d+\.app\.github\.dev$/, (m) =>
      m.replace(/-\d+/, "-8000")
    )}`;
  }
}

/** مبنای ساخت URL مطلق برای تصویر (بدون /api) */
const API_ORIGIN = (ABS_BASE || "").replace(/\/$/, "").replace(/\/api$/, "");

/** اگر مسیر /media/ باشد، همان نسبی بماند تا از پروکسی Next استفاده شود */
const absolutize = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("/media/")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return API_ORIGIN ? `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}` : url;
};

/**
 * buildApiURL:
 * - اگر ABS_BASE داشتیم، خروجی: https://.../api/<path>
 * - اگر نداشتیم، خروجی نسبی: /api/<path> و توسط rewrites به بک‌اند پروکسی می‌شود.
 */
function buildApiURL(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return ABS_BASE ? `${ABS_BASE}/api${p}` : `/api${p}`;
}

/* ---------------- Endpoints ---------------- */
export const endpoints = {
  home:       buildApiURL("/home/"),
  categories: buildApiURL("/categories/"),
  products:   buildApiURL("/products/"),
  bundles:    buildApiURL("/bundles/"),
  cart:       buildApiURL("/cart/"),
  cartClear:  buildApiURL("/cart/clear/"),
  orders:     buildApiURL("/orders/"),
  checkout:   buildApiURL("/orders/checkout/"),
  banners:    buildApiURL("/banners/"),

  auth: {
    login:    buildApiURL("/auth/login/"),
    register: buildApiURL("/auth/register/"),
    me:       buildApiURL("/auth/me/"),
    refresh:  buildApiURL("/token/refresh/"),
  },
} as const;

/* ===================== انواع و خطا ===================== */

import type { HomePayload, ProductItem } from "@/types/home";

type ReqOpts = {
  auth?: boolean;
  init?: RequestInit;
  fallback?: any;
  throwOnHTTP?: boolean;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;
  url: string;
  constructor(p: { message: string; status: number; url: string; payload?: unknown }) {
    super(p.message);
    this.name = "ApiError";
    this.status = p.status;
    this.url = p.url;
    this.payload = p.payload;
  }
}

/* ===================== JWT helpers & storage ===================== */

function getStoredAccess(): string | null {
  try {
    const keys = ["access", "access_token", "auth_token", "token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v.replace(/^Bearer\s+/i, "").trim();
    }
  } catch {}
  return null;
}

function getStoredRefresh(): string | null {
  try {
    const keys = ["refresh", "refresh_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v.trim();
    }
  } catch {}
  return null;
}

function saveAccessToken(tok: string) {
  try {
    const t = tok.replace(/^Bearer\s+/i, "").trim();
    localStorage.setItem("access", t);
    localStorage.setItem("access_token", t);
    localStorage.setItem("token", t);
  } catch {}
}
export function clearTokens() {
  try {
    ["token","auth_token","access","access_token","refresh","refresh_token"].forEach(k => localStorage.removeItem(k));
  } catch {}
}

/* ===================== utilities ===================== */

function extractMessage(payload: unknown, res: Response): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  const p = payload as any;
  if (typeof p?.detail === "string") return p.detail;
  if (typeof p?.message === "string") return p.message;
  if (typeof p?.error === "string") return p.error;
  if (p && typeof p === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(p)) {
      if (k === "detail") continue;
      if (Array.isArray(v)) {
        const line = v.filter(x => typeof x === "string").join(", ");
        if (line) parts.push(`${k}: ${line}`);
      } else if (typeof v === "string") {
        parts.push(`${k}: ${v}`);
      }
    }
    if (parts.length) return parts.join(" | ");
    try { return JSON.stringify(p); } catch {}
  }
  return `API ${res.status}: ${res.statusText}`;
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach(item => q.append(k, String(item)));
    else q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** تبدیل امن عدد از number/string (حذف کامای انگلیسی/فارسی و فاصله) */
const toNum = (v: any): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = Number(String(v).replace(/[,٬\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/* ===================== هستهٔ request + refresh ===================== */

async function request<T = any>(url: string, init: RequestInit = {}, opts?: ReqOpts): Promise<T> {
  if (!url) throw new Error("request(): URL is empty");

  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json, text/plain;q=0.9,*/*;q=0.8");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (opts?.auth) {
    const tok = getStoredAccess();
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
  }

  const doFetch = () =>
    fetch(url, {
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      ...init,
      headers,
      credentials: init.credentials ?? "same-origin",
    });

  let res = await doFetch();

  // تلاش برای رفرش توکن
  if (opts?.auth && res.status === 401 && endpoints.auth.refresh) {
    const refresh = getStoredRefresh();
    if (refresh) {
      try {
        const rr = await fetch(endpoints.auth.refresh, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh }),
          credentials: "include",
        });
        if (rr.ok) {
          const data = await rr.json().catch(() => ({} as any));
          if ((data as any)?.access) {
            saveAccessToken((data as any).access);
            res = await doFetch();
          } else {
            clearTokens();
          }
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      }
    }
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      const ct = res.headers.get("content-type") || "";
      payload = ct.includes("application/json") ? await res.json() : await res.text();
    } catch {}
    const msg = extractMessage(payload, res);
    if (opts?.throwOnHTTP === false) return (opts?.fallback ?? null) as T;
    throw new ApiError({ message: msg, status: res.status, url, payload });
  }

  if (res.status === 204) return (opts?.fallback ?? null) as T;

  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? await res.json() : await res.text()) as T;
}

/* ===================== خروجی عمومی ===================== */

export const get  = <T = any>(url: string, opts?: ReqOpts) =>
  request<T>(url, { method: "GET" }, opts);

export const post = <T = any>(url: string, body?: any, opts?: ReqOpts) =>
  request<T>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
    opts
  );

export const del  = <T = any>(url: string, opts?: ReqOpts) =>
  request<T>(url, { method: "DELETE" }, opts);

/* ===================== کمکی‌های محتوایی برای هوم ===================== */

type AnyList<T=any> = { results?: T[] } | T[] | null | undefined;
const listify = <T=any>(x: AnyList<T>): T[] =>
  Array.isArray(x) ? x : (Array.isArray((x as any)?.results) ? (x as any).results : []);

const tryGet = async <T=any>(url: string, fallback: T): Promise<T> =>
  get<T>(url, { throwOnHTTP: false, fallback });

/** نرمال‌سازی آیتم «محصول» به ProductItem با imageUrl مطلق/قابل‌استفاده */
function normalizeProduct(it: any): ProductItem {
  const imageCandidate =
    it?.imageUrl ?? it?.image ?? it?.thumbnail ?? it?.main_image ?? it?.cover ?? "";
  const imageUrl = absolutize(imageCandidate);

  const price = toNum(it?.price) || toNum(it?.final_price) || 0;

  return {
    id: String(it?.id ?? it?.pk ?? ""),
    title: String(it?.title ?? it?.name ?? "بدون عنوان"),
    imageUrl,
    price,
    compareAtPrice:
      toNum(it?.compare_at_price) ||
      toNum(it?.original_price) ||
      toNum(it?.list_price) || null,
    link: typeof it?.slug === "string" ? `/product/${it.slug}` : it?.link ?? "#",
    badge: it?.badge ?? null,
  };
}

/** نرمال‌سازی آیتم «باندل» به فرم ProductItem (قیمت/لینک صحیح) */
function normalizeBundleAsProduct(b: any): ProductItem {
  return {
    id: String(b?.id ?? b?.pk ?? ""),
    title: String(b?.title ?? b?.name ?? "بدون عنوان"),
    imageUrl: absolutize(b?.image ?? b?.imageUrl ?? b?.cover ?? ""),
    price:
      toNum(b?.bundle_price) ||
      toNum(b?.final_price) ||
      toNum(b?.price) || 0,
    compareAtPrice: null,
    link: typeof b?.slug === "string" ? `/bundles/${b.slug}` : (b?.link ?? "#"), // یک‌دست روی /bundles/
    badge: b?.badge ?? "باندل",
  };
}

/** تشخیص خودکار: اگر bundle_price داشت → باندل؛ وگرنه محصول معمولی */
function normalizeAnyProduct(it: any): ProductItem {
  const isBundle =
    toNum(it?.bundle_price) > 0 ||
    String(it?.type || "").toLowerCase() === "bundle";
  return isBundle ? normalizeBundleAsProduct(it) : normalizeProduct(it);
}

/* تلاش برای ساخت VIP از باندل/پروداکت با تگ‌های رایج + fallback به active */
async function buildVipBlock() {
  const tagKeys = ["vip", "VIP", "وی‌آی‌پی", "پکیج-وی-آی-پی", "package_vip"];

  // ۱) باندل‌های تگ‌دار
  for (const t of tagKeys) {
    const bundles = await tryGet<any>(
      endpoints.bundles + buildQuery({ tag: t, limit: 20 }),
      { results: [] }
    );
    const items = listify(bundles).map(normalizeBundleAsProduct);
    if (items.length) {
      return {
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        products: items,
        seeAllLink: "/vip",
      };
    }
  }

  // ۲) همه باندل‌های فعال
  const allActiveBundles = await tryGet<any>(
    endpoints.bundles + buildQuery({ active: true, limit: 20 }),
    { results: [] }
  );
  const activeItems = listify(allActiveBundles).map(normalizeBundleAsProduct);
  if (activeItems.length) {
    return {
      endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      products: activeItems,
      seeAllLink: "/vip",
    };
  }

  // ۳) محصولات تگ‌دار VIP (اگر باندل نبود)
  for (const t of tagKeys) {
    const prods = await tryGet<any>(
      endpoints.products + buildQuery({ tag: t, limit: 20 }),
      { results: [] }
    );
    const items = listify(prods).map(normalizeProduct);
    if (items.length) {
      return {
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        products: items,
        seeAllLink: "/vip",
      };
    }
  }

  return { endsAt: new Date().toISOString(), products: [], seeAllLink: "/vip" };
}

/* ست‌ها و پافر از محصولات با تگ‌های رایج */
async function buildSetsAndPuffer() {
  const tagCombos = [
    ["set", "sets", "ست", "ست‌ها"],
    ["puffer", "پافر", "پافرها"],
  ];
  const collected: ProductItem[] = [];
  for (const tags of tagCombos) {
    for (const t of tags) {
      const res = await tryGet<any>(
        endpoints.products + buildQuery({ tag: t, limit: 20 }),
        { results: [] }
      );
      const items = listify(res).map(normalizeAnyProduct); // ← تشخیص خودکار
      for (const it of items) {
        if (!collected.find(x => x.id === it.id)) collected.push(it);
      }
    }
  }
  return { items: collected.slice(0, 40) };
}

/* بنرها (اختیاری اگر /home برنگرداند) */
async function fetchBannersFallback() {
  const res = await tryGet<any>(endpoints.banners, []);
  return res;
}

/* ===================== توابع مخصوص ===================== */

// داده صفحه اصلی با fallback‌های مطمئن و نرمال‌سازی صحیح باندل/محصول
export async function fetchHome() {
  const base = await get<HomePayload>(endpoints.home, { throwOnHTTP: true });

  // VIP
  let vip = (base as any)?.vip;
  if (!vip || !Array.isArray(vip.products) || vip.products.length === 0) {
    vip = await buildVipBlock();
  } else {
    vip = {
      ...vip,
      products: (vip.products || []).map(normalizeAnyProduct), // ← مهم
    };
  }

  // ست‌ها و پافر
  let setsAndPuffer = (base as any)?.setsAndPuffer;
  if (!setsAndPuffer || !Array.isArray(setsAndPuffer.items) || setsAndPuffer.items.length === 0) {
    setsAndPuffer = await buildSetsAndPuffer();
  } else {
    setsAndPuffer = {
      ...setsAndPuffer,
      items: (setsAndPuffer.items || []).map(normalizeAnyProduct), // ← مهم
    };
  }

  // بنرها
  const banners = (base as any)?.banners ?? (await fetchBannersFallback());

  // heroSlides
  const heroSlides =
    Array.isArray((base as any)?.heroSlides) && (base as any).heroSlides.length
      ? (base as any).heroSlides
      : undefined;

  return {
    ...base,
    vip,
    setsAndPuffer,
    banners,
    ...(heroSlides ? { heroSlides } : {}),
  } as HomePayload & {
    vip: { endsAt?: string; products?: any[]; seeAllLink?: string };
    setsAndPuffer: { items?: any[] };
    banners?: any;
  };
}

/* گرفتن لیست محصولات */
export type ProductsQuery = {
  page?: number;
  page_size?: number | string;
  limit?: number | string;
  search?: string;
  ordering?: string;
  category?: string | number;
  tag?: string | number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  ids?: (string | number)[];
};

export type PaginatedResponse<T> = {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
} & Record<string, any>;

export async function fetchProducts(params?: ProductsQuery) {
  const url = endpoints.products + buildQuery(params);
  return get<PaginatedResponse<ProductItem>>(url, { throwOnHTTP: true });
}

export async function fetchProductById(id: string | number) {
  const url = `${endpoints.products}${id}/`;
  return get<ProductItem>(url, { throwOnHTTP: true });
}

export async function fetchBundles(params?: Record<string, any>) {
  const url = endpoints.bundles + buildQuery(params);
  return get<PaginatedResponse<any>>(url, { throwOnHTTP: true });
}
