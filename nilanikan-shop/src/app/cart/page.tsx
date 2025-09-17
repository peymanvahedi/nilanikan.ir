// src/app/cart/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id?: string | number;
  sku?: string;
  slug?: string;
  name?: string;
  title?: string;
  price?: number;
  qty?: number;
  image?: { url?: string } | string;
  thumbnail?: { url?: string } | string;
};

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE || process.env.NEXT_PUBLIC_API_BASE || "";

function toAbsUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${MEDIA_BASE}${u.startsWith("/") ? u : `/${u}`}`;
}

function getTitle(x: CartItem) {
  return x.name || (x as any).label || x.title || "";
}

function getImg(x: CartItem) {
  const raw =
    (typeof x.image === "string" ? x.image : x.image?.url) ||
    (typeof x.thumbnail === "string" ? x.thumbnail : x.thumbnail?.url) ||
    "";
  return toAbsUrl(raw || "");
}

function getUnitPrice(x: CartItem) {
  const p = (x as any).unit_price ?? x.price ?? (x as any).final_price ?? 0;
  return Number(p) || 0;
}

function keyOf(x: CartItem, i: number) {
  return String(x.sku || x.id || x.slug || i);
}

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // فقط بعد از mount سراغ localStorage برویم تا هیدریشن به‌هم نخورد
  useEffect(() => {
    setMounted(true);
  }, []);

  // خواندن اولیه از localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem("cart");
      const parsed: CartItem[] = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  // همگام‌سازی با رویدادهای موجود پروژه
  useEffect(() => {
    const addHandler = (e: Event) => {
      const any = e as CustomEvent<{ item?: CartItem; qty?: number }>;
      const addQty = any.detail?.qty ?? 1;
      const newItem = any.detail?.item;
      setItems((prev) => {
        let next = [...prev];
        if (newItem) {
          const k = keyOf(newItem, -1);
          const idx = next.findIndex((it, i) => keyOf(it, i) === k);
          if (idx >= 0) {
            next[idx] = { ...next[idx], qty: (next[idx].qty ?? 1) + addQty };
          } else {
            next.push({ ...newItem, qty: addQty });
          }
        }
        localStorage.setItem("cart", JSON.stringify(next));
        return next;
      });
    };

    const setHandler = (e: Event) => {
      const any = e as CustomEvent<{ items?: CartItem[]; count?: number }>;
      // اگر کل لیست را فرستادید
      if (any.detail?.items) {
        const arr = Array.isArray(any.detail.items) ? any.detail.items : [];
        localStorage.setItem("cart", JSON.stringify(arr));
        setItems(arr);
        return;
      }
      // اگر فقط count آمد، اینجا کاری نمی‌کنیم؛ هدر خودش count را می‌سازد
    };

    window.addEventListener("cart:add", addHandler as EventListener);
    window.addEventListener("cart:set", setHandler as EventListener);
    return () => {
      window.removeEventListener("cart:add", addHandler as EventListener);
      window.removeEventListener("cart:set", setHandler as EventListener);
    };
  }, []);

  const total = useMemo(
    () => items.reduce((s, it) => s + getUnitPrice(it) * (it.qty ?? 1), 0),
    [items]
  );

  const updateQty = (index: number, qty: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], qty: Math.max(1, qty) };
      localStorage.setItem("cart", JSON.stringify(next));
      // هماهنگ با هدر:
      window.dispatchEvent(
        new CustomEvent("cart:set", {
          detail: { count: next.reduce((n, i) => n + (i.qty ?? 1), 0) },
        })
      );
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      localStorage.setItem("cart", JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent("cart:set", {
          detail: { count: next.reduce((n, i) => n + (i.qty ?? 1), 0) },
        })
      );
      return next;
    });
  };

  if (!mounted || loading) {
    return (
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-10">
        <div className="animate-pulse text-zinc-400">در حال بارگذاری سبد…</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-10" dir="rtl">
        <h1 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">سبد خرید</h1>
        <div className="rounded-xl border border-dashed p-6 sm:p-8 text-center text-zinc-600">
          سبد شما خالی است.
          <div className="mt-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
            >
              رفتن به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-10" dir="rtl">
      <h1 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">سبد خرید</h1>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {items.map((it, i) => {
          const img = getImg(it);
          const name = getTitle(it);
          const price = getUnitPrice(it);
          const qty = it.qty ?? 1;

          return (
            <div
              key={keyOf(it, i)}
              className="
                rounded-xl border p-3 sm:p-4
                flex flex-col sm:flex-row
                items-stretch sm:items-center
                gap-3 sm:gap-4
              "
            >
              {/* تصویر */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-50 order-1">
                {img ? (
                  <Image src={img} alt={name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full grid place-items-center text-zinc-400">—</div>
                )}
              </div>

              {/* عنوان و قیمت واحد */}
              <div className="flex-1 order-2">
                <div className="font-semibold text-zinc-800 text-sm sm:text-base line-clamp-2">
                  {name}
                </div>
                <div className="text-xs sm:text-sm text-zinc-500 mt-1">
                  قیمت واحد: {price.toLocaleString("fa-IR")} تومان
                </div>
              </div>

              {/* کنترل تعداد */}
              <div className="order-3 sm:order-none flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={() => updateQty(i, qty - 1)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-lg grid place-items-center"
                  aria-label="کاهش تعداد"
                >
                  −
                </button>
                <input
                  value={qty}
                  onChange={(e) => updateQty(i, Number(e.target.value) || 1)}
                  inputMode="numeric"
                  className="w-12 h-8 sm:h-9 text-center rounded-lg border text-sm sm:text-base"
                />
                <button
                  onClick={() => updateQty(i, qty + 1)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-lg grid place-items-center"
                  aria-label="افزایش تعداد"
                >
                  +
                </button>
              </div>

              {/* قیمت کل و حذف */}
              <div className="order-4 sm:order-none flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="font-bold text-zinc-800 text-sm sm:text-base">
                  {(price * qty).toLocaleString("fa-IR")}{" "}
                  <span className="text-xs">تومان</span>
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="px-3 py-2 rounded-lg border text-xs sm:text-sm hover:bg-zinc-50"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between rounded-xl border p-3 sm:p-4">
        <div className="text-zinc-600 text-sm sm:text-base">
          جمع کل:{" "}
          <span className="font-extrabold text-zinc-900">
            {total.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
          </span>
        </div>
        <Link
          href="/checkout"
          className="px-4 sm:px-5 py-3 rounded-xl bg-pink-600 text-white hover:bg-pink-700 text-center"
        >
          ادامه فرایند خرید
        </Link>
      </div>
    </div>
  );
}
