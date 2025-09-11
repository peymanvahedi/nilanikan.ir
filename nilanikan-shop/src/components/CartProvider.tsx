// src/components/CartProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addToCart as apiAdd,
  addManyToCart as apiAddMany,
  clearCart as apiClear,
  removeFromCart as apiRemove,
  getCart as apiGetCart,
} from "@/lib/cart";

declare global {
  interface WindowEventMap {
    "cart:set": CustomEvent<{ count: number }>;
    "cart-change": CustomEvent<void>;   // عمداً استفاده نمی‌کنیم
    "cart:hydrate": CustomEvent<void>;
  }
}

export type ProductLine = {
  kind: "product";
  id: number;
  name: string;
  price: number;
  image?: string;
  qty: number;
};

export type BundleLine = {
  kind: "bundle";
  id: number;
  title: string;
  price: number;
  qty: number;
  items: Array<{
    productId: number;
    name: string;
    qty: number;
    price: number;
  }>;
};

export type CartItem = ProductLine | BundleLine;

type AddProductInput = Omit<ProductLine, "kind" | "qty">;
type AddBundleInput  = Omit<BundleLine, "kind" | "qty">;

const STORAGE_KEYS = ["cart.items", "cart", "cart_v2"] as const;

type CartContextType = {
  items: CartItem[];
  addItem: (item: AddProductInput, qty?: number) => Promise<void> | void;
  addBundle: (bundle: AddBundleInput, qty?: number) => Promise<void> | void;
  removeItem: (key: { kind: CartItem["kind"]; id: number }) => Promise<void> | void;
  clear: () => void;
  total: number;
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Aliases
  add?: (line: CartItem) => Promise<void> | void;
  addLine?: (line: CartItem) => Promise<void> | void;
  push?: (line: CartItem) => Promise<void> | void;
  remove?: (line: { kind: CartItem["kind"]; id: number }) => Promise<void> | void;
  removeLine?: (line: { kind: CartItem["kind"]; id: number }) => Promise<void> | void;
  delete?: (line: { kind: CartItem["kind"]; id: number }) => Promise<void> | void;
  deleteLine?: (line: { kind: CartItem["kind"]; id: number }) => Promise<void> | void;
};

const CartContext = createContext<CartContextType | null>(null);

const hasToken = () =>
  typeof window !== "undefined" && !!localStorage.getItem("token");

/* -------------------------- LocalStorage helpers ------------------------- */
function readAnyLocal(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    for (const k of STORAGE_KEYS) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CartItem[];
    }
  } catch {}
  return [];
}
function writeAllLocal(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(items);
    for (const k of STORAGE_KEYS) localStorage.setItem(k, json);
  } catch {}
}

/* -------------------------------- Provider ------------------------------- */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readAnyLocal());
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useRef(false);

  const setBadge = (count: number) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("cart:set", { detail: { count } }));
    // عمداً cart-change را اینجا dispatch نمی‌کنیم
  };

  const setFromLocalIfChanged = () => {
    const next = readAnyLocal();
    setItems((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  };

  // mount + (اختیاری) sync با سرور
  useEffect(() => {
    hydrated.current = true;
    setBadge(items.reduce((s, p: any) => s + (p?.qty ?? 0), 0));

    (async () => {
      if (!hasToken()) return;
      try {
        const { items: serverItems, source } = await apiGetCart();
        if (source === "server") {
          if (serverItems.length === 0 && items.length > 0) {
            // merge local -> server (فقط محصولات)
            const prods = items.filter((x): x is ProductLine => x.kind === "product");
            for (const p of prods) {
              await apiAdd(
                { id: p.id, name: p.name, price: p.price, image: p.image },
                p.qty
              );
            }
            writeAllLocal(items);
          } else {
            // normalize server -> UI
            setItems(
              (serverItems as any[]).map((it) => ({
                kind: "product" as const,
                id: Number(it.id ?? it.product_id ?? it.product?.id),
                name: String(it.name ?? it.title ?? `محصول ${it.id}`),
                price: Number(it.price ?? 0),
                image: it.image ?? it.images?.[0] ?? undefined,
                qty: Number(it.qty ?? it.quantity ?? 1),
              }))
            );
          }
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist + badge
  useEffect(() => {
    if (!hydrated.current) return;
    writeAllLocal(items);
    setBadge(items.reduce((s, p: any) => s + (p?.qty ?? 0), 0));
  }, [items]);

  // فقط به cart:hydrate و storage گوش بده
  useEffect(() => {
    const hydrateFromLocal = () => setFromLocalIfChanged();
    const onStorage = (e: StorageEvent) => {
      if (e.key && (STORAGE_KEYS as readonly string[]).includes(e.key)) hydrateFromLocal();
    };
    window.addEventListener("cart:hydrate", hydrateFromLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cart:hydrate", hydrateFromLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* -------------------------------- Actions ------------------------------- */
  const addItem: CartContextType["addItem"] = (item, qty = 1) => {
    const q = Math.max(1, Number(qty) || 1);

    // 1) آپدیت خوش‌بینانه
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.kind === "product" && p.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx] as ProductLine;
        next[idx] = { ...line, qty: line.qty + q };
        return next;
      }
      return [...prev, { kind: "product", ...item, qty: q }];
    });
    setIsOpen(true);

    // 2) سرور در پس‌زمینه
    (async () => {
      if (!hasToken()) return;
      try {
        await apiAdd(
          { id: item.id, name: item.name, price: item.price, image: item.image },
          q
        );
      } catch {
        // رول‌بک ساده: کاهش qty یا حذف
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.kind === "product" && p.id === item.id);
          if (idx === -1) return prev;
          const next = [...prev];
          const line = next[idx] as ProductLine;
          const newQty = line.qty - q;
          if (newQty > 0) next[idx] = { ...line, qty: newQty };
          else next.splice(idx, 1);
          return next;
        });
      }
    })();
  };

  const addBundle: CartContextType["addBundle"] = (bundle, qty = 1) => {
    const q = Math.max(1, Number(qty) || 1);

    // 1) آپدیت خوش‌بینانه
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.kind === "bundle" && p.id === bundle.id);
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx] as BundleLine;
        next[idx] = { ...line, qty: line.qty + q };
        return next;
      }
      return [...prev, { kind: "bundle", ...bundle, qty: q }];
    });
    setIsOpen(true);

    // 2) سرور در پس‌زمینه (addMany)
    (async () => {
      if (!(hasToken() && bundle.items?.length)) return;
      try {
        await apiAddMany(
          bundle.items.map((i) => ({
            id: i.productId,
            name: i.name,
            price: i.price,
            image: undefined,
          })),
          q
        );
      } catch {
        // رول‌بک
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.kind === "bundle" && p.id === bundle.id);
          if (idx === -1) return prev;
          const next = [...prev];
          const line = next[idx] as BundleLine;
          const newQty = line.qty - q;
          if (newQty > 0) next[idx] = { ...line, qty: newQty };
          else next.splice(idx, 1);
          return next;
        });
      }
    })();
  };

  const removeItem: CartContextType["removeItem"] = ({ kind, id }) => {
    // خوش‌بینانه
    setItems((prev) => prev.filter((p) => !(p.kind === kind && p.id === id)));

    // سرور در پس‌زمینه
    (async () => {
      if (!(hasToken() && kind === "product")) return;
      try {
        await apiRemove(id);
      } catch {
        // اگر خطا: از سرور هیدراته کن
        try {
          const { items: serverItems, source } = await apiGetCart();
          if (source === "server") {
            const normalized = (serverItems as any[]).map((it) => ({
              kind: "product" as const,
              id: Number(it.id ?? it.product_id ?? it.product?.id),
              name: String(it.name ?? it.title ?? `محصول ${it.id}`),
              price: Number(it.price ?? 0),
              image: it.image ?? it.images?.[0] ?? undefined,
              qty: Number(it.qty ?? it.quantity ?? 1),
            }));
            setItems(normalized);
          }
        } catch {}
      }
    })();
  };

  const clear: CartContextType["clear"] = () => {
    // 1) آپدیت فوری UI + local
    setItems([]);
    writeAllLocal([]); // به‌جای removeAllLocal، برای سازگاری
    setBadge(0);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart:hydrate"));
    }

    // 2) پاک کردن سمت سرور در پس‌زمینه
    (async () => {
      if (!hasToken()) return;
      try {
        await apiClear();
      } catch {
        // اگر سرور خطا داد، از سرور دوباره هیدراته کن
        try {
          const { items: serverItems, source } = await apiGetCart();
          if (source === "server") {
            const normalized = (serverItems as any[]).map((it) => ({
              kind: "product" as const,
              id: Number(it.id ?? it.product_id ?? it.product?.id),
              name: String(it.name ?? it.title ?? `محصول ${it.id}`),
              price: Number(it.price ?? 0),
              image: it.image ?? it.images?.[0] ?? undefined,
              qty: Number(it.qty ?? it.quantity ?? 1),
            }));
            setItems(normalized);
            writeAllLocal(normalized);
            setBadge(normalized.reduce((s, p) => s + (p?.qty ?? 0), 0));
            window.dispatchEvent(new CustomEvent("cart:hydrate"));
          }
        } catch {}
      }
    })();
  };

  /* -------------------------------- Selectors ----------------------------- */
  const total = useMemo(() => items.reduce((sum, p) => sum + p.price * p.qty, 0), [items]);
  const count = useMemo(() => items.reduce((sum, p) => sum + p.qty, 0), [items]);

  /* ------------------------------- UI toggles ------------------------------ */
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((v) => !v);

  const add = async (line: CartItem) => {
    if (line.kind === "product") await addItem(line, line.qty);
    else await addBundle(line, line.qty);
  };

  const value: CartContextType = {
    items,
    addItem,
    addBundle,
    removeItem,
    clear,
    total,
    count,
    isOpen,
    open,
    close,
    toggle,
    add,
    addLine: add,
    push: add,
    remove: removeItem,
    removeLine: removeItem,
    delete: removeItem,
    deleteLine: removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* --------------------------------- Hook ---------------------------------- */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
