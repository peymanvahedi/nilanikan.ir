// src/lib/api.ts
/* ===================== BASE ===================== */
const API_PREFIX = "/api";
const MEDIA_PREFIX = (process.env.NEXT_PUBLIC_MEDIA_PREFIX ?? "/media/").replace(/\/?$/, "/");
const MEDIA_ORIGIN = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

/* ===================== Endpoints ===================== */
export const endpoints = {
  home: "home/",
  categories: "categories/",
  products: "products/",
  bundles: "bundles/",
  cart: "cart/",
  cartClear: "cart/clear/",
  orders: "orders/",
  checkout: "orders/checkout/",
  banners: "banners/",
  auth: {
    login: "auth/login/",
    register: "auth/register/",
    me: "auth/me/",
    refresh: "token/refresh/",
  },
} as const;

/* ===================== Helpers ===================== */
export function toApi(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_PREFIX}/${path.replace(/^\/+/, "")}`;
}

export function absolutizeMedia(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  let path = url.startsWith("/") ? url : `/${url}`;
  if (!path.startsWith(MEDIA_PREFIX)) {
    if (/^\/?(slides|banners|uploads|media)\//i.test(path)) {
      if (!/^\/?media\//i.test(path)) path = `${MEDIA_PREFIX}${path.replace(/^\//, "")}`;
    } else {
      path = `${MEDIA_PREFIX}${path.replace(/^\//, "")}`;
    }
  }
  return MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${path}` : path;
}

/* ===================== Request Core ===================== */
export class ApiError extends Error {
  status: number;
  url: string;
  payload?: unknown;
  constructor(p: { message: string; status: number; url: string; payload?: unknown }) {
    super(p.message);
    this.name = "ApiError";
    this.status = p.status;
    this.url = p.url;
    this.payload = p.payload;
  }
}

type ReqOpts = {
  auth?: boolean;
  init?: RequestInit;
  fallback?: any;
  throwOnHTTP?: boolean; // اگر false باشد، به‌جای throw همان fallback برمی‌گرداند
};

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
    ["token", "auth_token", "access", "access_token", "refresh", "refresh_token"].forEach((k) =>
      localStorage.removeItem(k),
    );
  } catch {}
}

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
        const line = v.filter((x) => typeof x === "string").join(", ");
        if (line) parts.push(`${k}: ${line}`);
      } else if (typeof v === "string") {
        parts.push(`${k}: ${v}`);
      }
    }
    if (parts.length) return parts.join(" | ");
    try {
      return JSON.stringify(p);
    } catch {}
  }
  return `API ${res.status}: ${res.statusText}`;
}

export function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((item) => q.append(k, String(item)));
    else q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function request<T = any>(path: string, init: RequestInit = {}, opts?: ReqOpts): Promise<T> {
  const url = toApi(path);
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
      next: { revalidate: 0, ...(opts?.init as any)?.next },
      ...init,
      headers,
      credentials: init.credentials ?? "include", // 🔑 تغییر اصلی
    });

  let res = await doFetch();

  // سعی در refresh token
  if (opts?.auth && res.status === 401 && endpoints.auth.refresh) {
    const refresh = getStoredRefresh();
    if (refresh) {
      try {
        const rr = await fetch(toApi(endpoints.auth.refresh), {
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

/* ===================== Public helpers ===================== */
export const get = <T = any>(path: string, opts?: ReqOpts) =>
  request<T>(path, { method: "GET" }, opts);

export const post = <T = any>(path: string, body?: any, opts?: ReqOpts) =>
  request<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
    opts,
  );

export const del = <T = any>(path: string, opts?: ReqOpts) =>
  request<T>(path, { method: "DELETE" }, opts);

/* ===================== Home helpers (اختیاری) ===================== */
import type { HomePayload, ProductItem } from "@/types/home";

const toNum = (v: any): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = Number(String(v).replace(/[,٬\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

type AnyList<T = any> = { results?: T[] } | T[] | null | undefined;
const listify = <T = any>(x: AnyList<T>): T[] =>
  Array.isArray(x) ? x : Array.isArray((x as any)?.results) ? (x as any).results : [];

const tryGet = async <T = any>(path: string, fallback: T): Promise<T> =>
  get<T>(path, { throwOnHTTP: false, fallback });

function normalizeProduct(it: any): ProductItem {
  const imageCandidate = it?.imageUrl ?? it?.image ?? it?.thumbnail ?? it?.main_image ?? it?.cover ?? "";
  const imageUrl = absolutizeMedia(imageCandidate);
  const price = toNum(it?.price) || toNum(it?.final_price) || 0;

  return {
    id: String(it?.id ?? it?.pk ?? ""),
    title: String(it?.title ?? it?.name ?? "بدون عنوان"),
    imageUrl,
    price,
    compareAtPrice:
      toNum(it?.compare_at_price) || toNum(it?.original_price) || toNum(it?.list_price) || null,
    link: typeof it?.slug === "string" ? `/product/${it.slug}` : it?.link ?? "#",
    badge: it?.badge ?? null,
  };
}
function normalizeBundleAsProduct(b: any): ProductItem {
  return {
    id: String(b?.id ?? b?.pk ?? ""),
    title: String(b?.title ?? b?.name ?? "بدون عنوان"),
    imageUrl: absolutizeMedia(b?.image ?? b?.imageUrl ?? b?.cover ?? ""),
    price: toNum(b?.bundle_price) || toNum(b?.final_price) || toNum(b?.price) || 0,
    compareAtPrice: null,
    link: typeof b?.slug === "string" ? `/bundles/${b.slug}` : b?.link ?? "#",
    badge: b?.badge ?? "باندل",
  };
}
function normalizeAnyProduct(it: any): ProductItem {
  const isBundle = toNum(it?.bundle_price) > 0 || String(it?.type || "").toLowerCase() === "bundle";
  return isBundle ? normalizeBundleAsProduct(it) : normalizeProduct(it);
}

async function buildVipBlock() {
  const tagKeys = ["vip", "VIP", "وی‌آی‌پی", "پکیج-وی-آی-پی", "package_vip"];

  for (const t of tagKeys) {
    const bundles = await tryGet<any>(`${endpoints.bundles}?tag=${encodeURIComponent(t)}&limit=20`, { results: [] });
    const items = listify(bundles).map(normalizeBundleAsProduct);
    if (items.length) {
      return {
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        products: items,
        seeAllLink: "/vip",
      };
    }
  }

  const allActiveBundles = await tryGet<any>(`${endpoints.bundles}?active=true&limit=20`, { results: [] });
  const activeItems = listify(allActiveBundles).map(normalizeBundleAsProduct);
  if (activeItems.length) {
    return {
      endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      products: activeItems,
      seeAllLink: "/vip",
    };
  }

  for (const t of tagKeys) {
    const prods = await tryGet<any>(`${endpoints.products}?tag=${encodeURIComponent(t)}&limit=20`, { results: [] });
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

async function buildSetsAndPuffer() {
  const tagCombos = [
    ["set", "sets", "ست", "ست‌ها"],
    ["puffer", "پافر", "پافرها"],
  ];
  const collected: ProductItem[] = [];
  for (const tags of tagCombos) {
    for (const t of tags) {
      const res = await tryGet<any>(`${endpoints.products}?tag=${encodeURIComponent(t)}&limit=20`, { results: [] });
      const items = listify(res).map(normalizeAnyProduct);
      for (const it of items) {
        if (!collected.find((x) => x.id === it.id)) collected.push(it);
      }
    }
  }
  return { items: collected.slice(0, 40) };
}

async function fetchBannersFallback() {
  return tryGet<any>(endpoints.banners, []);
}

/* ===================== fetchHome ===================== */
export async function fetchHome() {
  const base = await get<HomePayload>(endpoints.home, { throwOnHTTP: true });

  // VIP
  let vip = (base as any)?.vip;
  if (!vip || !Array.isArray(vip.products) || vip.products.length === 0) {
    vip = await buildVipBlock();
  } else {
    vip = { ...vip, products: (vip.products || []).map(normalizeAnyProduct) };
  }

  // Sets & Puffer
  let setsAndPuffer = (base as any)?.setsAndPuffer;
  if (!setsAndPuffer || !Array.isArray(setsAndPuffer.items) || setsAndPuffer.items.length === 0) {
    setsAndPuffer = await buildSetsAndPuffer();
  } else {
    setsAndPuffer = { ...setsAndPuffer, items: (setsAndPuffer.items || []).map(normalizeAnyProduct) };
  }

  // Banners
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
