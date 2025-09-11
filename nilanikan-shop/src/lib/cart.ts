// src/lib/cart.ts
import { get, post, del, endpoints } from "@/lib/api";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  qty: number;
};
export type CartItemBase = Pick<CartItem, "id" | "name" | "price" | "image">;

const LS_KEYS = ["cart.items", "cart"] as const;

/* ------------------------ util: base url & cookies ------------------------ */
const getApiBase = () =>
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_URL) ||
  (typeof window !== "undefined" && (window as any).__NEXT_PUBLIC_API_URL__) ||
  "http://localhost:8000";

const toAbs = (u: string) => {
  const BASE = getApiBase();
  return /^https?:\/\//i.test(u) ? u : `${BASE}${u.startsWith("/") ? u : `/${u}`}`;
};

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const safeName = name.replace(/[-./*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|; )${safeName}=([^;]*)`);
  const m = document.cookie.match(pattern);
  if (!m || typeof m[1] !== "string") return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
};

const setCookie = (name: string, value: string, opts: { path?: string } = {}) => {
  if (typeof document === "undefined") return;
  const path = opts.path ?? "/";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}`;
};

/* ------------------------ util: token/key providers ----------------------- */
const hasToken = () => typeof window !== "undefined" && !!localStorage.getItem("token");
const readToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const readApiKey = () => (typeof window !== "undefined" ? localStorage.getItem("api_key") : null);

/* ------------------------ localStorage helpers ------------------------ */
function isCartItemArray(x: any): x is CartItem[] {
  return (
    Array.isArray(x) &&
    x.every(
      (i) =>
        i &&
        typeof i.id === "number" &&
        typeof i.name === "string" &&
        typeof i.price === "number" &&
        typeof i.qty === "number"
    )
  );
}
function normalizeAnyArray(arr: any[]): CartItem[] {
  return arr
    .map((it) => {
      const id =
        typeof it?.id === "number"
          ? it.id
          : typeof it?.product_id === "number"
          ? it.product_id
          : typeof it?.product?.id === "number"
          ? it.product.id
          : undefined;
      if (typeof id !== "number") return null;
      const name = String(it?.name ?? it?.title ?? it?.product?.name ?? `محصول ${id}`);
      const price = Number(it?.price ?? it?.unit_price ?? it?.product?.price ?? 0) || 0;
      const image = (it?.image ?? it?.thumbnail ?? it?.images?.[0] ?? it?.product?.image) ?? null;
      const qty = Number(it?.qty ?? it?.quantity ?? it?.count ?? 1) || 1;
      return { id, name, price, image, qty } as CartItem;
    })
    .filter(Boolean) as CartItem[];
}
function readLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEYS[0]);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isCartItemArray(parsed)) return parsed;
    }
    const oldRaw = localStorage.getItem(LS_KEYS[1]);
    if (oldRaw) {
      const arr = JSON.parse(oldRaw);
      if (Array.isArray(arr)) return normalizeAnyArray(arr);
    }
  } catch {}
  return [];
}
function writeLocal(items: CartItem[]) {
  try {
    const json = JSON.stringify(items);
    localStorage.setItem(LS_KEYS[0], json);
    localStorage.setItem(LS_KEYS[1], json);
  } catch {}
}
function removeLocalAll() {
  try {
    LS_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
function countLocal(items: CartItem[]) {
  return items.reduce((s, x) => s + (x.qty || 0), 0);
}
function dispatchAdd(qty: number) {
  try {
    window.dispatchEvent(new CustomEvent("cart:add", { detail: { qty } }));
    window.dispatchEvent(new Event("cart-change"));
  } catch {}
}
function dispatchSet(count: number) {
  try {
    window.dispatchEvent(new CustomEvent("cart:set", { detail: { count } }));
    window.dispatchEvent(new Event("cart-change"));
  } catch {}
}

/* ------------------------- AUTH/CSRF helper layer ------------------------- */
async function csrfPreflight(): Promise<{ xsrf?: string } | null> {
  const base = getApiBase();
  const hit = async (path: string) => {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "GET",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
      });
      return res.ok || res.status === 204;
    } catch {
      return false;
    }
  };
  const ok = (await hit("/sanctum/csrf-cookie")) || (await hit("/csrf-cookie"));
  if (!ok) return null;
  const xsrf = readCookie("XSRF-TOKEN") || readCookie("xsrf-token") || undefined;
  return { xsrf };
}

/* مسیرهای محتمل checkout را امتحان می‌کنیم */
function resolveCheckoutUrls(): string[] {
  const list = [
    endpoints?.checkout ? toAbs(endpoints.checkout) : "",
    toAbs("/api/checkout"),
    toAbs("/checkout"),
  ].filter(Boolean);
  // de-dup
  return Array.from(new Set(list));
}

/* اول سشن/CSRF، بعداً سایر واریانت‌ها */
function buildAuthVariantsSessionFirst(url: string) {
  const token = readToken();
  const apiKey = readApiKey();

  const headerVariants: Array<Record<string, string>> = [];
  // 1) فقط سشن/CSRF
  headerVariants.push({});
  // 2) API Key
  if (apiKey) headerVariants.push({ "X-API-KEY": apiKey });
  // 3) Bearer/Token (در انتها)
  if (token) {
    headerVariants.push({ Authorization: `Bearer ${token}` });
    headerVariants.push({ Authorization: `Token ${token}` });
  }

  const urlVariants = [url];
  // پارامتر api_token را فقط در انتها تست می‌کنیم
  if (token) urlVariants.push(`${url}${url.includes("?") ? "&" : "?"}api_token=${encodeURIComponent(token)}`);

  return { headerVariants, urlVariants };
}

async function sendWithAuthOnce(
  inputUrl: string,
  init: RequestInit,
  { useJson }: { useJson: boolean }
) {
  const xsrf = readCookie("XSRF-TOKEN") || readCookie("xsrf-token") || undefined;
  const baseHeaders: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    ...(xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
    ...(xsrf ? { "X-CSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
  };
  const { headerVariants, urlVariants } = buildAuthVariantsSessionFirst(inputUrl);

  for (const u of urlVariants) {
    for (const hv of headerVariants) {
      const headers: Record<string, string> = {
        ...baseHeaders,
        ...(init.headers as Record<string, string>),
        ...hv,
      };
      if (useJson) headers["Content-Type"] = "application/json";

      const res = await fetch(u, {
        ...init,
        credentials: "include",
        headers,
      });

      if (res.status !== 401 && res.status !== 419) return res;
    }
  }
  return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" });
}

async function sendWithAuthAndCsrfRetry(
  url: string,
  init: RequestInit,
  { useJson }: { useJson: boolean }
) {
  let res = await sendWithAuthOnce(url, init, { useJson });
  if (res.status !== 401 && res.status !== 419) return res;
  await csrfPreflight();
  res = await sendWithAuthOnce(url, init, { useJson });
  return res;
}

/* ------------------------------ SERVER IO ----------------------------- */
async function fetchServerCartRaw(): Promise<any[]> {
  const data = await get(endpoints.cart, { auth: true });
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any)?.results)) return (data as any).results;
  if (Array.isArray((data as any)?.items)) return (data as any).items;
  return [];
}
async function fetchServerCartNormalized(): Promise<CartItem[]> {
  const raw = await fetchServerCartRaw();
  return normalizeAnyArray(raw);
}
function matchCartLine(item: any, wanted: number | string) {
  const wid = String(wanted);
  const lineId =
    item?.id ?? item?.line_id ?? item?.cart_item_id ?? item?.pk ?? null;
  const productId =
    item?.product_id ??
    item?.productId ??
    item?.product ??
    item?.product?.id ??
    null;
  return {
    lineId: lineId != null ? String(lineId) : null,
    productId: productId != null ? String(productId) : null,
    hit:
      (lineId != null && String(lineId) === wid) ||
      (productId != null && String(productId) === wid),
  };
}

/* ----------------------------------- API ---------------------------------- */
export async function getCart(): Promise<{ items: CartItem[]; source: "server" | "local" }> {
  try {
    if (hasToken()) {
      const items = await fetchServerCartNormalized();
      writeLocal(items);
      dispatchSet(countLocal(items));
      return { items, source: "server" };
    }
  } catch {}
  const items = typeof window !== "undefined" ? readLocal() : [];
  return { items, source: "local" };
}

export async function addToCart(item: CartItemBase, qty = 1) {
  const q = Math.max(1, Number(qty) || 1);

  try {
    if (hasToken()) {
      try {
        await post(endpoints.cart, { product_id: item.id, qty: q }, { auth: true });
      } catch {
        await post(endpoints.cart, { product_id: item.id, quantity: q }, { auth: true });
      }
      try {
        const serverItems = await fetchServerCartNormalized();
        writeLocal(serverItems);
        dispatchSet(countLocal(serverItems));
      } catch {
        dispatchAdd(q);
      }
      return;
    }
  } catch {}

  if (typeof window === "undefined") return;
  const items = readLocal();
  const idx = items.findIndex((x) => String(x.id) === String(item.id));
  if (idx >= 0) items[idx] = { ...items[idx]!, qty: (items[idx]!.qty || 0) + q };
  else items.push({ ...item, image: item.image ?? null, qty: q });
  writeLocal(items);
  dispatchAdd(q);
}

export async function addManyToCart(itemsIn: CartItemBase[], qtyEach = 1) {
  const q = Math.max(1, Number(qtyEach) || 1);
  const totalQty = itemsIn.length * q;

  try {
    if (hasToken()) {
      const payload = { items: itemsIn.map((it) => ({ product_id: it.id, qty: q })) };
      try {
        await post(endpoints.cart, payload, { auth: true });
      } catch {
        for (const it of itemsIn) {
          await post(endpoints.cart, { product_id: it.id, qty: q }, { auth: true });
        }
      }
      try {
        const serverItems = await fetchServerCartNormalized();
        writeLocal(serverItems);
        dispatchSet(countLocal(serverItems));
      } catch {
        dispatchAdd(totalQty);
      }
      return;
    }
  } catch {}

  if (typeof window === "undefined") return;
  const items = readLocal();
  for (const it of itemsIn) {
    const idx = items.findIndex((x) => String(x.id) === String(it.id));
    if (idx >= 0) items[idx] = { ...items[idx]!, qty: (items[idx]!.qty || 0) + q };
    else items.push({ ...it, image: it.image ?? null, qty: q });
  }
  writeLocal(items);
  dispatchAdd(totalQty);
}

export async function removeFromCart(productId: number | string): Promise<CartItem[]> {
  try {
    if (hasToken()) {
      const raw = await fetchServerCartRaw();
      let lineId: string | null = null;
      for (const it of raw) {
        const m = matchCartLine(it, productId);
        if (m.hit) {
          lineId = m.lineId;
          break;
        }
      }

      if (lineId) {
        try {
          await del(`${endpoints.cart}${lineId}/`, { auth: true });
        } catch {}
      }
      try {
        await del(`${endpoints.cart}?product_id=${productId}`, { auth: true });
      } catch {}
      try {
        await del(`${endpoints.cart}?product=${productId}`, { auth: true });
      } catch {}
      try {
        await post(`${endpoints.cart}remove/`, { product_id: productId }, { auth: true });
      } catch {}
      try {
        await post(endpoints.cart, { product_id: productId, qty: 0 }, { auth: true });
      } catch {}
      if (lineId) {
        try {
          await post(`${endpoints.cart}remove/`, { id: lineId }, { auth: true });
        } catch {}
      }

      const serverItems = await fetchServerCartNormalized();
      writeLocal(serverItems);
      dispatchSet(countLocal(serverItems));
      return serverItems;
    }
  } catch {}

  if (typeof window === "undefined") return [];
  const after = readLocal().filter((x) => String(x.id) !== String(productId));
  writeLocal(after);
  dispatchSet(countLocal(after));
  return after;
}

export async function clearCart(): Promise<CartItem[]> {
  try {
    if (hasToken()) {
      try {
        await post(endpoints.cartClear ?? `${endpoints.cart}clear/`, { confirm: true }, { auth: true });
      } catch {
        try {
          await del(endpoints.cart, { auth: true });
        } catch {
          await post(`${endpoints.cart}clear/`, { confirm: true }, { auth: true });
        }
      }
      try {
        const serverItems = await fetchServerCartNormalized();
        writeLocal(serverItems);
        dispatchSet(countLocal(serverItems));
        return serverItems;
      } catch {}
    }
  } catch {}

  if (typeof window === "undefined") return [];
  removeLocalAll();
  dispatchSet(0);
  return [];
}

/** ثبت سفارش (ساده و سازگار با Django) */
export async function checkout(payload?: Record<string, any>) {
  // فقط همون چیزایی که بک‌اند نیاز داره بفرست؛ بقیه رو نفرست که 500 نگیری
  const body = {
    address:        payload?.address ?? "",
    postal_code:    payload?.postal_code ?? payload?.postalCode ?? "",
    shipping_method: payload?.shipping_method ?? payload?.shipping?.method ?? "post",
    shipping_cost:   payload?.shipping_cost ?? payload?.shipping?.cost ?? 0,
  };

  try {
    // حتماً با auth:true تا هدر Bearer اضافه شود
const data = await post(endpoints.checkout, body, { auth: true });
    // انتظار: { order_id, total_amount, status }
    return { ok: true as const, data };
  } catch (e: any) {
    // متن خطا را ساده برگردان تا روی صفحه چاپ شود
    return {
      ok: false as const,
      error: e?.message || "Checkout failed",
    };
  }
}
