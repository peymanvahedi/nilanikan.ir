// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const endpoints = {
  categories: `${BASE}/api/categories/`,
  products:   `${BASE}/api/products/`,
  bundles:    `${BASE}/api/bundles/`,
  cart:       `${BASE}/api/cart/`,
  cartClear:  `${BASE}/api/cart/clear/`,
  checkout:   `${BASE}/api/orders/checkout/`,
  auth: {
    login:    `${BASE}/api/auth/login/`,
    refresh:  `${BASE}/api/token/refresh/`,
    register: `${BASE}/api/auth/register/`,
    me:       `${BASE}/api/auth/me/`,
  },
} as const;

type ReqOpts = {
  auth?: boolean;          // اگر true باشد هدر Authorization اضافه می‌شود
  init?: RequestInit;
  fallback?: any;          // مقدار پیش‌فرض در صورت خطا
  throwOnHTTP?: boolean;   // اگر false باشد 4xx هم throw نمی‌کند
};

class ApiError extends Error {
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

/* ---------------- JWT helpers ---------------- */
function b64urlToUtf8(s?: string): string {
  if (!s) return "";
  try {
    const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
    const base = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
    // کار در هر دو محیط: مرورگر (atob) و Node (Buffer)
    const g: any = globalThis as any;
    const bin =
      typeof atob === "function"
        ? atob(base)
        : g?.Buffer?.from(base, "base64")?.toString("binary");

    if (!bin) return "";

    const uri = Array.prototype
      .map.call(bin, (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("");

    return decodeURIComponent(uri);
  } catch {
    return "";
  }
}

function parseJwt(token?: string): any | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    const payload = parts.length > 1 ? parts[1] : undefined;
    const json = b64urlToUtf8(payload);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isAccessToken(token: string): boolean {
  const p = parseJwt(token);
  if (p && typeof p === "object") {
    if (p.token_type && typeof p.token_type === "string") {
      return p.token_type.toLowerCase() === "access";
    }
    // اگر token_type نباشد، فرض را بر access می‌گذاریم
  }
  return true;
}
function isRefreshToken(token: string): boolean {
  const p = parseJwt(token);
  return !!(p && typeof p === "object" && String(p.token_type || "").toLowerCase() === "refresh");
}

/* ---------------- token storage ---------------- */
function getStoredToken(): string | null {
  try {
    // فقط کلیدهای مشخص access را چک کن؛ از "token" فقط در صورت access شدن استفاده کن
    const keys = ["access", "access_token", "auth_token", "token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && typeof v === "string") {
        const t = v.replace(/^Bearer\s+/i, "").trim();
        if (t && isAccessToken(t)) return t;
      }
    }
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|;\s*)(access|access_token|token)=([^;]+)/i);
      if (m && m[2]) {
        const t = decodeURIComponent(m[2]).replace(/^Bearer\s+/i, "").trim();
        if (t && isAccessToken(t)) return t;
      }
    }
  } catch {}
  return null;
}
function getStoredRefresh(): string | null {
  try {
    const keys = ["refresh", "refresh_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && typeof v === "string") {
        const t = v.trim();
        if (t && (isRefreshToken(t) || !isAccessToken(t))) return t;
      }
    }
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|;\s*)(refresh|refresh_token)=([^;]+)/i);
      if (m && m[2]) {
        const t = decodeURIComponent(m[2]).trim();
        if (t && (isRefreshToken(t) || !isAccessToken(t))) return t;
      }
    }
  } catch {}
  return null;
}
function saveAccessToken(tok: string) {
  try {
    const t = tok.replace(/^Bearer\s+/i, "").trim();
    // برای سازگاری عقب‌رو
    localStorage.setItem("access", t);
    localStorage.setItem("access_token", t);
    localStorage.setItem("token", t);
  } catch {}
}
export function saveRefreshToken(tok: string) {
  try {
    localStorage.setItem("refresh", tok.trim());
    localStorage.setItem("refresh_token", tok.trim());
  } catch {}
}
export function clearTokens() {
  try {
    ["token","auth_token","access","access_token","refresh","refresh_token"].forEach(k => localStorage.removeItem(k));
  } catch {}
}

/* ---------------- helpers ---------------- */
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

/* --------------- core request with auto-refresh --------------- */
async function request<T = any>(url: string, init: RequestInit = {}, opts?: ReqOpts): Promise<T> {
  if (!url) throw new Error("request(): URL is empty");

  const makeHeaders = (base?: HeadersInit, hasBody?: boolean) => {
    const h = new Headers(base || {});
    if (!h.has("Accept")) h.set("Accept", "application/json, text/plain;q=0.9,*/*;q=0.8");
    if (hasBody && !h.has("Content-Type")) h.set("Content-Type", "application/json");
    return h;
  };

  const attachAuth = (h: Headers) => {
    if (opts?.auth) {
      const tok = getStoredToken();
      if (tok && isAccessToken(tok)) {
        h.set("Authorization", `Bearer ${tok}`);
      }
    }
  };

  const doFetch = async (): Promise<Response> => {
    const headers = makeHeaders(init.headers as HeadersInit, !!init.body);
    attachAuth(headers);
    return fetch(url, {
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      ...init,
      headers,
      credentials: init.credentials ?? "same-origin",
    });
  };

  let res = await doFetch();

  // اگر 401 شد: تلاش برای رفرش توکن و تکرار درخواست
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
          if (data?.access) {
            saveAccessToken(data.access);
            res = await doFetch(); // retry با access جدید
          }
        }
      } catch {}
    }
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      const ct = res.headers.get("content-type") || "";
      payload = ct.includes("application/json") ? await res.json() : await res.text();
    } catch {}

    // اگر توکن نامعتبر بود، پاک‌سازی تا لاگین مجدد
    const detail = typeof payload === "string" ? payload : (payload as any)?.detail;
    if (res.status === 401 && typeof detail === "string" &&
        /Given token not valid|credentials were not provided|not authenticated/i.test(detail)) {
      clearTokens();
    }

    const msg = extractMessage(payload, res);
    const err = new ApiError({ message: msg, status: res.status, url, payload });

    if (res.status >= 500) {
      console.error("API " + res.status, msg, { url, payload });
      return (opts?.fallback ?? null) as T;
    }
    if (opts?.throwOnHTTP === false) {
      console.warn("API " + res.status, msg, { url, payload });
      return (opts?.fallback ?? null) as T;
    }
    throw err;
  }

  if (res.status === 204) return (opts?.fallback ?? null) as T;

  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? await res.json() : await res.text()) as T;
}

/* --------------- exported helpers --------------- */
export const get  = <T = any>(url: string, opts?: ReqOpts) =>
  request<T>(url, { method: "GET" }, opts);

export const post = <T = any>(url: string, body?: any, opts?: ReqOpts) =>
  request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }, opts);

export const del  = <T = any>(url: string, opts?: ReqOpts) =>
  request<T>(url, { method: "DELETE" }, opts);
