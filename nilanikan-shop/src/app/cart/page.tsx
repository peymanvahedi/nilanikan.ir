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

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
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

  // تلاش برای استفاده از Provider
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
        await cartCtx.clear(); // بلافاصله UI خالی می‌شود
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">سبد خرید</h1>
      </div>

      {loading ? (
        <p className="text-zinc-600">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center">
          <p className="mb-4">سبد خرید خالی است.</p>
          <Link href="/products" className="inline-block rounded-xl bg-pink-600 px-4 py-2 text-white">
            شروع خرید
          </Link>
        </div>
      ) : (
        <>
          {/* لیست آیتم‌ها */}
          <div className="grid gap-4">
            {(() => {
              const arr = Array.isArray(items) ? items : [];
              const seen = new Map<string, number>(); // شمارنده کلیدهای تکراری

              return arr.map((it, idx) => {
                const id = (it as any)?.id ?? idx;
                const kind = (it as any)?.kind ?? "product";

                // پایه کلید
                const base = `${String(kind)}-${String(id)}`;

                // اگر تکراری است، سافیکس شماره بزن
                const n = seen.get(base) ?? 0;
                seen.set(base, n + 1);
                const key = n === 0 ? base : `${base}-${n}`;

                const name = String((it as any)?.name ?? "بدون نام");
                const price = Number((it as any)?.price ?? 0);
                const qty = Number((it as any)?.qty ?? (it as any)?.quantity ?? 1);
                const img: string =
                  (typeof (it as any)?.image === "string" && (it as any).image) ||
                  "https://picsum.photos/seed/cart/300/300";

                return (
                  <div
                    key={key}
                    className="grid grid-cols-[80px_1fr_auto] items-center gap-3 rounded-2xl border p-3"
                  >
                    {/* تصویر */}
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-zinc-100">
                      <SafeImg src={img} alt={name} className="h-full w-full object-cover" />
                    </div>

                    {/* نام و قیمت */}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">{name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        تعداد: {qty} • قیمت واحد: {price.toLocaleString("fa-IR")} تومان
                      </div>
                    </div>

                    {/* جمع جزء */}
                    <div className="text-left text-pink-600 font-extrabold">
                      {(price * qty).toLocaleString("fa-IR")}
                      <span className="mr-1 text-[11px]">تومان</span>
                    </div>
                  </div>
                );
              });
            })()}

            {/* خالی بودن سبد */}
            {(!Array.isArray(items) || items.length === 0) && (
              <p className="text-sm text-zinc-500">سبد خرید خالی است.</p>
            )}
          </div>

          {/* فوتر */}
          <div className="mt-6 grid items-start gap-4 md:grid-cols-[1fr_320px]">
            <div>
              <button
                onClick={clearAll}
                disabled={busy}
                className="h-11 rounded-xl border px-4 font-medium hover:bg-zinc-50 disabled:opacity-60"
              >
                خالی کردن سبد
              </button>
            </div>

            <aside className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">تعداد اقلام</span>
                <span className="font-bold">{toFa(totals.count)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-zinc-500">مبلغ کل</span>
                <span className="text-lg font-extrabold text-pink-600">
                  {toFa(totals.price)} <span className="text-xs">تومان</span>
                </span>
              </div>

              {/* فقط هدایت می‌کنیم؛ اینجا هیچ checkoutای انجام نمی‌شود */}
              <Link
                href="/checkout"
                className="mt-4 block h-11 w-full rounded-xl bg-pink-600 text-center leading-[44px] font-bold text-white hover:bg-pink-700 disabled:opacity-60"
              >
                ادامه و ثبت سفارش
              </Link>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
