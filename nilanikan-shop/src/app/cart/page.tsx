"use client";
import SafeImg from "@/components/SafeImg";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCart as getCartFallback,
  addToCart,
  removeFromCart,
  clearCart,
  type CartItem as LibCartItem,
} from "@/lib/cart";
import { useCart as useCartHook } from "@/components/CartProvider";
import { API_BASE } from "@/lib/api"; // ✅ اضافه شد

const BASE = API_BASE; // ✅ استفاده از متغیر مرکزی
const toFa = (n: number) => Number(n || 0).toLocaleString("fa-IR");
const resolveImage = (src?: string | null, seed?: string) =>
  !src
    ? `https://picsum.photos/seed/${encodeURIComponent(seed || "prod")}/400`
    : src.startsWith("http")
    ? src
    : `${BASE}${src}`;

type UiLine = {
  kind: "product" | "bundle";
  id: number;
  name: string;
  price: number;
  qty: number;
  image?: string | null;
};

function normalizeFromProvider(items: any[] | undefined | null): UiLine[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((li: any) =>
      li?.kind === "bundle"
        ? {
            kind: "bundle" as const,
            id: Number(li.id),
            name: String(li.title ?? `باندل #${li.id}`),
            price: Number(li.price ?? 0),
            qty: Number(li.qty ?? 1),
            image: null,
          }
        : {
            kind: "product" as const,
            id: Number(li.id ?? li.product_id ?? li.product?.id),
            name: String(li.name ?? li.title ?? li.product?.name ?? `#${li?.id}`),
            price: Number(li.price ?? li.product?.price ?? 0),
            qty: Number(li.qty ?? li.quantity ?? 1),
            image: li.image ?? li.images?.[0] ?? li.product?.image ?? null,
          }
    )
    .filter((x) => x.id > 0);
}

function normalizeFromLib(items: LibCartItem[] | undefined | null): UiLine[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      kind: "product" as const,
      id: Number((it as any).id ?? (it as any).product_id),
      name: String((it as any).name ?? (it as any).title ?? `#${(it as any).id}`),
      price: Number((it as any).price ?? 0),
      qty: Number((it as any).qty ?? (it as any).quantity ?? 1),
      image: (it as any).image ?? null,
    }))
    .filter((x) => x.id > 0);
}

export default function CartPage() {
  const [fallbackItems, setFallbackItems] = useState<UiLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  let cartCtx: ReturnType<typeof useCartHook> | null = null;
  try {
    cartCtx = useCartHook();
  } catch {
    cartCtx = null;
  }

  const items: UiLine[] = cartCtx ? normalizeFromProvider(cartCtx.items) : fallbackItems;

  const totals = useMemo(
    () => ({
      count: items.reduce((s, x) => s + (x.qty || 0), 0),
      price: items.reduce((s, x) => s + x.price * x.qty, 0),
    }),
    [items]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (cartCtx) {
        setLoading(false);
        return;
      }
      try {
        const res = await getCartFallback();
        if (!mounted) return;
        setFallbackItems(normalizeFromLib(res.items || []));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [!!cartCtx]);

  const plusOne = async (line: UiLine) => {
    setBusy(true);
    try {
      if (cartCtx) {
        await cartCtx.addItem(
          { id: line.id, name: line.name, price: line.price, image: line.image || undefined },
          1
        );
      } else {
        await addToCart(
          { id: line.id, name: line.name, price: line.price, image: line.image || undefined },
          1
        );
        const res = await getCartFallback();
        setFallbackItems(normalizeFromLib(res.items || []));
      }
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (line: UiLine) => {
    setBusy(true);
    try {
      if (cartCtx) {
        await cartCtx.removeItem({ kind: line.kind, id: line.id });
      } else {
        const updated = await removeFromCart(line.id);
        setFallbackItems(normalizeFromLib(updated));
      }
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("سبد خرید کاملاً خالی شود؟")) return;
    setBusy(true);
    try {
      if (cartCtx) {
        await cartCtx.clear();
      } else {
        const updated = await clearCart();
        setFallbackItems(normalizeFromLib(updated));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      {/* باقی کد JSX بدون تغییر */}
    </main>
  );
}
