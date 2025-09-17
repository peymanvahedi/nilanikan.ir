// src/lib/api.ts

// ───────────────────────────────────────────────────────────
// Base URL
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000")
  .replace(/\/+$/, "");

export const endpoints = {
  home: "/api/home/",
  bundles: "/api/bundles/",
  products: "/api/products/",
  categories: "/api/categories/",
  cart: "/api/cart/",
  // مسیر درست چک‌اوت:
  checkout: "/api/orders/checkout/",
};

// ───────────────────────────────────────────────────────────
// URL helpers
function ensurePath(p: string) {
  if (!p) return "/";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `/${p.replace(/^\/+/, "")}`;
}
function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${ensurePath(path)}`;
}

// ───────────────────────────────────────────────────────────
// Query helpers
export type Query = Record<string, any>;

export function buildQuery(q?: Query) {
  if (!q) return "";
  const params = new URLSearchParams();

  const append = (k: string, v: any) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((vv) => append(k, vv));
    else params.append(k, String(v));
  };

  Object.entries(q).forEach(([k, v]) => append(k, v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

// ───────────────────────────────────────────────────────────
// Error
export class ApiError extends Error {
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

// ───────────────────────────────────────────────────────────
// Low-level fetch
async function _fetch(url: string, init: RequestInit = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "omit", // بدون کوکی/سشن
      headers: { Accept: "application/json", ...(init.headers || {}) },
      signal: ctrl.signal,
      ...init,
    });
    if (!res.ok) {
      let payload: any = null;
      try { payload = await res.json(); } catch {}
      throw new ApiError({ message: `HTTP ${res.status} for ${url}`, status: res.status, url, payload });
    }
    try { return await res.json(); } catch { return null; }
  } finally {
    clearTimeout(timer);
  }
}

export type ReqOpts = { throwOnHTTP?: boolean; fallback?: any; init?: RequestInit; auth?: boolean };

async function request<T = any>(method: string, path: string, body?: any, opts?: ReqOpts): Promise<T> {
  const url = buildUrl(path);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const init: RequestInit = {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(opts?.init?.headers || {}),
    },
    ...(isFormData ? { body } : body != null ? { body: JSON.stringify(body) } : {}),
    ...(opts?.init || {}),
  };

  try {
    return (await _fetch(url, init)) as T;
  } catch (e) {
    if (opts?.throwOnHTTP === false) return (opts?.fallback ?? null) as T;
    throw e;
  }
}

export async function get<T = any>(path: string, opts?: ReqOpts): Promise<T> {
  return request<T>("GET", path, undefined, opts);
}
export async function post<T = any>(path: string, body?: any, opts?: ReqOpts): Promise<T> {
  return request<T>("POST", path, body, opts);
}
export async function del<T = any>(path: string, opts?: ReqOpts): Promise<T> {
  return request<T>("DELETE", path, undefined, opts);
}

// ───────────────────────────────────────────────────────────
// Media utils
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");
const MEDIA_PREFIX = (process.env.NEXT_PUBLIC_MEDIA_PREFIX ?? "/media/").replace(/\/?$/, "/");

export function toMedia(filePath: string): string {
  if (!filePath) return "";
  const clean = String(filePath).replace(/^\/+/, "");
  if (MEDIA_BASE) return `${MEDIA_BASE}${MEDIA_PREFIX}${clean}`;
  return `${MEDIA_PREFIX}${clean}`;
}

export function absolutizeMedia(u?: string | null): string {
  if (!u) return "";
  const url = String(u);
  if (/^https?:\/\//i.test(url)) return url;
  return buildUrl(url.startsWith("/") ? url : `/${url}`);
}

export function listify<T = any>(x: any): T[] {
  return Array.isArray(x) ? x : Array.isArray(x?.results) ? x.results : [];
}

// ───────────────────────────────────────────────────────────
// High-level helpers
export async function fetchHome(): Promise<any> {
  return await get(endpoints.home, { throwOnHTTP: false, fallback: {} });
}

export type APIResponse<T> = { results: T[] } | T;

// تست/استفاده در چک‌اوت: بعد از دریافت payment_url، ریدایرکت کن
export async function startCheckout(body: Record<string, any>) {
  const res = await post(endpoints.checkout, body, { throwOnHTTP: false });
  if (res?.payment_url) {
    if (typeof window !== "undefined") window.location.href = res.payment_url;
    return res;
  }
  return res; // شامل detail/error برای نمایش
}
