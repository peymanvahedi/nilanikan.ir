// src/components/BundleItemPicker.tsx
"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { addToCart } from "@/lib/cart";

// ——— انواع مشترک ———
type Attribute = { name?: string | null; value?: string | null };

type BundleItem = {
  productId: number;
  name: string;
  price: number;
  quantity?: number;
  image?: string | null;
};

type Summary = {
  total: number;
  subtotal: number;
  discountAmount: number;
  selectedCount: number;
  selectedQty: number;
};

type Props = {
  bundleId: number | string;
  title?: string;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
  items: BundleItem[];
  onSummaryChange?: (summary: Summary) => void;

  /** انتخاب‌های تب پایین: productId => لیست ویژگی‌های انتخاب‌شده */
  externalSelectedAttributes?: Record<number, Attribute[]>;

  /** برای باز کردن پاپ‌آپ جزئیات محصول در صفحه‌ی باندل */
  onRequestPreview?: (productId: number) => void;
};

function toFa(n: number) {
  try {
    return n.toLocaleString("fa-IR");
  } catch {
    return String(n);
  }
}

/** ساخت لیبل خوانا برای نمایش ویژگی‌ها */
const attrLabel = (a: { name?: string | null; value?: string | null }) =>
  [a?.name, a?.value].filter(Boolean).join(": ");

export default function BundleItemPicker({
  bundleId,
  title,
  discountType,
  discountValue,
  items,
  onSummaryChange,
  externalSelectedAttributes,
  onRequestPreview,
}: Props) {
  // وضعیت انتخاب و تعداد
  const [selected, setSelected] = useState<Record<number, { checked: boolean; qty: number }>>(() => {
    const init: Record<number, { checked: boolean; qty: number }> = {};
    for (const it of items) {
      const q = Math.max(1, Number(it.quantity ?? 1));
      init[it.productId] = { checked: true, qty: q };
    }
    return init;
  });

  // ✅ قیمت پویا و ویژگی‌های انتخاب‌شده (که از پاپ‌آپ می‌آیند)
  const [priceOverrides, setPriceOverrides] = useState<Record<number, number>>({});
  const [attrSelections, setAttrSelections] = useState<Record<number, Attribute[]>>({});

  // وقتی آیتم‌ها تغییر کنند، انتخاب‌های اولیه را هم‌تراز کن
  useEffect(() => {
    setSelected((prev) => {
      const next: Record<number, { checked: boolean; qty: number }> = { ...prev };
      for (const it of items) {
        if (!next[it.productId]) {
          next[it.productId] = { checked: true, qty: Math.max(1, Number(it.quantity ?? 1)) };
        }
      }
      // آیتم‌های حذف‌شده از لیست را پاک کن
      for (const idStr of Object.keys(next)) {
        const id = Number(idStr);
        if (!items.some((it) => it.productId === id)) {
          delete next[id];
        }
      }
      return next;
    });

    // سینک حذف برای override ها و ویژگی‌ها
    setPriceOverrides((prev) => {
      const clone = { ...prev };
      for (const pid of Object.keys(clone).map(Number)) {
        if (!items.some((it) => it.productId === pid)) delete clone[pid];
      }
      return clone;
    });
    setAttrSelections((prev) => {
      const clone = { ...prev };
      for (const pid of Object.keys(clone).map(Number)) {
        if (!items.some((it) => it.productId === pid)) delete clone[pid];
      }
      return clone;
    });
  }, [items]);

  // کال‌بک پایدار برای Summary
  const callbackRef = useRef<Props["onSummaryChange"]>();
  useEffect(() => {
    callbackRef.current = onSummaryChange;
  }, [onSummaryChange]);

  // هلسپرها
  const safeInt = (v: unknown, fallback = 1) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const setQty = useCallback((id: number, q: number) => {
    setSelected((s) => {
      const clamped = Math.max(1, Math.min(99, safeInt(q, 1)));
      return { ...s, [id]: { checked: s[id]?.checked ?? true, qty: clamped } };
    });
  }, []);

  const inc = (id: number) => setQty(id, (selected[id]?.qty ?? 1) + 1);
  const dec = (id: number) => setQty(id, (selected[id]?.qty ?? 1) - 1);
  const toggle = (id: number) =>
    setSelected((s) => ({ ...s, [id]: { checked: !s[id]?.checked, qty: s[id]?.qty || 1 } }));

  // ✅ دریافت آیتم از QuickView (پاپ‌آپ صفحه‌ی باندل) — با attrs + unitPrice
  useEffect(() => {
    const onQuickAdd = (ev: Event) => {
      const e = ev as CustomEvent<{
        productId: number;
        quantity: number;
        attributes?: Attribute[];
        unitPrice?: number;
      }>;

      const { productId, quantity, attributes, unitPrice } = e?.detail || {};
      if (!productId) return;

      // انتخاب و تعداد
      setSelected((s) => ({
        ...s,
        [productId]: { checked: true, qty: Math.max(1, Number(quantity) || 1) },
      }));

      // ویژگی‌ها (اختیاری)
      if (Array.isArray(attributes)) {
        setAttrSelections((prev) => ({ ...prev, [productId]: attributes }));
      }

      // قیمت واحد داینامیک (اختیاری)
      if (typeof unitPrice === "number" && Number.isFinite(unitPrice)) {
        setPriceOverrides((prev) => ({ ...prev, [productId]: Math.max(0, Math.floor(unitPrice)) }));
      }
    };

    document.addEventListener("bundle:addItemFromQuickView", onQuickAdd as EventListener);
    return () => document.removeEventListener("bundle:addItemFromQuickView", onQuickAdd as EventListener);
  }, []);

  // آیتم‌های آماده برای سبد (با قیمت override و attrs)
  const selectedForCart = useMemo(() => {
    const out: {
      id: number;
      name: string;
      price: number;
      image?: string | null;
      qty: number;
      attributes?: Attribute[];
    }[] = [];
    for (const it of items) {
      const s = selected[it.productId];
      if (!s?.checked) continue;
      const qty = Math.max(1, Number(s.qty || 1));
      const unit = priceOverrides[it.productId] ?? it.price; // ✅ قیمت پویا
      out.push({
        id: it.productId,
        name: it.name,
        price: unit,
        image: it.image ?? null,
        qty,
        attributes: attrSelections[it.productId] || externalSelectedAttributes?.[it.productId] || [],
      });
    }
    return out;
  }, [items, selected, priceOverrides, attrSelections, externalSelectedAttributes]);

  // محاسبات مبلغ
  const subtotal = useMemo(
    () => selectedForCart.reduce((sum, it) => sum + it.price * it.qty, 0),
    [selectedForCart]
  );

  const discountAmount = useMemo(() => {
    if (!discountType || !discountValue || subtotal <= 0) return 0;
    if (discountType === "percent") return Math.round((subtotal * Number(discountValue)) / 100);
    return Math.min(subtotal, Math.round(Number(discountValue)));
  }, [discountType, discountValue, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const selectedCount = selectedForCart.length;
  const selectedQty = useMemo(
    () => selectedForCart.reduce((s, it) => s + it.qty, 0),
    [selectedForCart]
  );

  // فراخوانی کال‌بک فقط هنگام تغییر واقعی
  const lastSummaryRef = useRef<Summary | null>(null);
  const summary = useMemo<Summary>(
    () => ({ total, subtotal, discountAmount, selectedCount, selectedQty }),
    [total, subtotal, discountAmount, selectedCount, selectedQty]
  );

  useEffect(() => {
    const prev = lastSummaryRef.current;
    const changed =
      !prev ||
      prev.total !== summary.total ||
      prev.subtotal !== summary.subtotal ||
      prev.discountAmount !== summary.discountAmount ||
      prev.selectedCount !== summary.selectedCount ||
      prev.selectedQty !== summary.selectedQty;

    if (changed) {
      lastSummaryRef.current = summary;
      callbackRef.current?.(summary);
    }
  }, [summary]);

  const addSelectedToCart = async () => {
    if (selectedForCart.length === 0) return;
    for (const it of selectedForCart) {
      await addToCart(
        {
          id: it.id,
          name: it.name,
          price: it.price,
          image: it.image ?? null,
          // @ts-expect-error: extend cart item with attributes
          attributes: it.attributes || [],
        },
        it.qty
      );
    }
    alert("به سبد اضافه شد.");
  };

  return (
    <>
      {/* کانتینر اصلی انتخاب آیتم‌ها */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 overflow-hidden w-full">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-extrabold text-zinc-900">آیتم‌ها را انتخاب کن</h3>
          <div className="text-xs text-zinc-500">
            انتخاب‌شده:{" "}
            <b className="text-zinc-700">
              {selectedCount} مورد / {toFa(selectedQty)} عدد
            </b>
          </div>
        </div>

        {/* ✅ همیشه تک‌ستونه، مثل موبایل (دسکتاپ هم) */}
        <div className="grid grid-cols-1 gap-3 min-w-0">
          {items.map((it) => {
            const state = selected[it.productId] || { checked: true, qty: 1 };
            const attrs =
              attrSelections[it.productId] ||
              externalSelectedAttributes?.[it.productId] ||
              [];
            const hasAttrs = attrs.length > 0;
            const unitPrice = priceOverrides[it.productId] ?? it.price; // ✅ نمایش قیمت override

            return (
              <div
                key={it.productId}
                className="grid grid-cols-[24px_56px_1fr_auto] items-center gap-3 rounded-xl border border-zinc-200 p-3 overflow-hidden max-w-full"
              >
                {/* انتخاب/عدم انتخاب */}
                <input
                  aria-label="انتخاب آیتم"
                  type="checkbox"
                  checked={!!state.checked}
                  onChange={() => toggle(it.productId)}
                  className="h-5 w-5 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
                />

                {/* تصویر */}
                <div className="relative h-14 w-14 overflow-hidden rounded-lg ring-1 ring-zinc-200">
                  <Image src={it.image || "/placeholder.svg"} alt={it.name} fill className="object-cover" />
                </div>

                {/* نام + قیمت واحد + خلاصه ویژگی‌ها */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-zinc-900 line-clamp-2">{it.name}</div>

                    {/* ✅ دکمه مشاهده جزئیات (QuickView) */}
                    <button
                      type="button"
                      onClick={() => onRequestPreview?.(it.productId)}
                      className="shrink-0 h-8 rounded-lg border border-zinc-200 px-2 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50"
                      title="مشاهده جزئیات"
                    >
                      مشاهده جزئیات
                    </button>
                  </div>

                  <div className="text-xs text-zinc-500 mt-0.5">
                    {toFa(unitPrice)} <span>تومان</span> / واحد
                    {priceOverrides[it.productId] != null && (
                      <span className="ms-2 text-[11px] text-pink-600">(با ویژگی‌ها)</span>
                    )}
                  </div>

                  {/* خلاصه ویژگی‌های انتخابی */}
                  {hasAttrs && (
                    <div className="mt-1 text-[11px] leading-5 text-zinc-600">
                      <span className="font-bold text-zinc-700">ویژگی‌ها: </span>
                      {attrs
                        .map((a) => attrLabel(a))
                        .filter((s) => s && s.trim().length > 0)
                        .join("، ")}
                    </div>
                  )}
                </div>

                {/* کنترل تعداد (عمودی) */}
                <div className="flex flex-col items-stretch justify-center">
                  <label className="sr-only">تعداد</label>
                  <div className="flex items-stretch rounded-lg border border-zinc-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => inc(it.productId)}
                      className="w-7 text-xs font-bold hover:bg-zinc-50"
                      aria-label="افزایش"
                      title="افزایش"
                    >
                      ▲
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={99}
                      value={state.qty}
                      onChange={(e) => setQty(it.productId, e.target.value === "" ? 1 : Number(e.target.value))}
                      className="h-9 w-12 text-center outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => dec(it.productId)}
                      className="w-7 text-xs font-bold hover:bg-zinc-50"
                      aria-label="کاهش"
                      title="کاهش"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* جمع + دکمه (دسکتاپ) */}
        <div className="mt-4 hidden md:flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            جمع انتخابی: <b className="text-zinc-900">{toFa(total)}</b>
            <span className="mr-1">تومان</span>
            {discountType && discountValue ? (
              <span className="ml-3 text-xs text-emerald-600">
                (تخفیف: {discountType === "percent" ? `${discountValue}%` : `${toFa(Number(discountValue))} تومان`})
              </span>
            ) : null}
          </div>

          <button
            onClick={addSelectedToCart}
            className="h-10 rounded-xl bg-pink-600 px-5 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
            disabled={selectedCount === 0}
          >
            افزودن موارد انتخاب‌شده به سبد
          </button>
        </div>
      </div>

      {/* نوار چسبان موبایل */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:hidden">
        <div className="mx-auto max-w-screen-lg px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs leading-5">
            <div className="text-zinc-500">جمع انتخابی:</div>
            <div className="font-extrabold text-pink-600">{toFa(total)} تومان</div>
          </div>

          <button
            onClick={addSelectedToCart}
            className="flex-1 h-11 rounded-xl bg-pink-600 px-4 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
            disabled={selectedCount === 0}
          >
            افزودن
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
