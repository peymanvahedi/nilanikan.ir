// src/components/BundleItemPicker.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { addToCart } from "@/lib/cart";

// ——— انواع مشترک ———
type Attribute = { name?: string | null; value?: string | null };

type BundleItem = {
  productId: number;
  name: string;
  price: number;
  quantity?: number; // استفاده نمی‌شود؛ همیشه ۱
  image?: string | null;
};

type Summary = {
  total: number;
  subtotal: number;
  discountAmount: number;
  selectedCount: number;
  selectedQty: number; // = selectedCount
};

type Props = {
  bundleId: number | string;
  title?: string;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
  items: BundleItem[];
  onSummaryChange?: (summary: Summary) => void;
  externalSelectedAttributes?: Record<number, Attribute[]>;
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
  // فقط وضعیت انتخاب/عدم‌انتخاب؛ تعداد نداریم
  const [selected, setSelected] = useState<Record<number, { checked: boolean }>>(() => {
    const init: Record<number, { checked: boolean }> = {};
    for (const it of items) init[it.productId] = { checked: true };
    return init;
  });

  // قیمت پویا و ویژگی‌های انتخاب‌شده (از QuickView)
  const [priceOverrides, setPriceOverrides] = useState<Record<number, number>>({});
  const [attrSelections, setAttrSelections] = useState<Record<number, Attribute[]>>({});

  // هم‌ترازی با تغییر لیست آیتم‌ها
  useEffect(() => {
    setSelected((prev) => {
      const next: Record<number, { checked: boolean }> = { ...prev };
      for (const it of items) if (!next[it.productId]) next[it.productId] = { checked: true };
      for (const idStr of Object.keys(next)) {
        const id = Number(idStr);
        if (!items.some((it) => it.productId === id)) delete next[id];
      }
      return next;
    });

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

  // کال‌بک Summary پایدار
  const callbackRef = useRef<Props["onSummaryChange"]>();
  useEffect(() => {
    callbackRef.current = onSummaryChange;
  }, [onSummaryChange]);

  const toggle = (id: number) =>
    setSelected((s) => ({ ...s, [id]: { checked: !s[id]?.checked } }));

  // دریافت از QuickView — تعداد نادیده (همیشه ۱)
  useEffect(() => {
    const onQuickAdd = (ev: Event) => {
      const e = ev as CustomEvent<{
        productId: number;
        quantity?: number;
        attributes?: Attribute[];
        unitPrice?: number;
      }>;
      const { productId, attributes, unitPrice } = e?.detail || {};
      if (!productId) return;
      setSelected((s) => ({ ...s, [productId]: { checked: true } }));
      if (Array.isArray(attributes)) {
        setAttrSelections((prev) => ({ ...prev, [productId]: attributes }));
      }
      if (typeof unitPrice === "number" && Number.isFinite(unitPrice)) {
        setPriceOverrides((prev) => ({ ...prev, [productId]: Math.max(0, Math.floor(unitPrice)) }));
      }
    };

    document.addEventListener("bundle:addItemFromQuickView", onQuickAdd as EventListener);
    return () => document.removeEventListener("bundle:addItemFromQuickView", onQuickAdd as EventListener);
  }, []);

  // آیتم‌های آماده برای سبد — qty = 1
  const selectedForCart = useMemo(() => {
    const out: {
      id: number;
      name: string;
      price: number;
      image?: string | null;
      qty: 1;
      attributes?: Attribute[];
    }[] = [];
    for (const it of items) {
      const s = selected[it.productId];
      if (!s?.checked) continue;
      const unit = priceOverrides[it.productId] ?? it.price;
      out.push({
        id: it.productId,
        name: it.name,
        price: unit,
        image: it.image ?? null,
        qty: 1 as const,
        attributes: attrSelections[it.productId] || externalSelectedAttributes?.[it.productId] || [],
      });
    }
    return out;
  }, [items, selected, priceOverrides, attrSelections, externalSelectedAttributes]);

  // محاسبات مبلغ (qty = 1)
  const subtotal = useMemo(
    () => selectedForCart.reduce((sum, it) => sum + it.price, 0),
    [selectedForCart]
  );

  const discountAmount = useMemo(() => {
    if (!discountType || !discountValue || subtotal <= 0) return 0;
    if (discountType === "percent") return Math.round((subtotal * Number(discountValue)) / 100);
    return Math.min(subtotal, Math.round(Number(discountValue)));
  }, [discountType, discountValue, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const selectedCount = selectedForCart.length;
  const selectedQty = selectedCount;

  // اطلاع به والد در صورت تغییر
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
          // @ts-expect-error: نگهداری ویژگی‌ها در آیتم سبد
          attributes: it.attributes || [],
        },
        1 // همیشه ۱
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
            انتخاب‌شده: <b className="text-zinc-700">{selectedCount} مورد</b>
          </div>
        </div>

        {/* لیست آیتم‌ها */}
        <div className="grid grid-cols-1 gap-3 min-w-0">
          {items.map((it) => {
            const state = selected[it.productId] || { checked: true };
            const attrs =
              attrSelections[it.productId] ||
              externalSelectedAttributes?.[it.productId] ||
              [];
            const hasAttrs = attrs.length > 0;
            const unitPrice = priceOverrides[it.productId] ?? it.price;

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

                {/* نام + دکمه جزئیات زیر آن + قیمت و ویژگی‌ها */}
                <div className="min-w-0">
                  {/* عنوان کامل؛ بدون line-clamp */}
                  <div className="text-sm font-bold text-zinc-900 break-words">{it.name}</div>

                  {/* دکمه مشاهده جزئیات زیر عنوان */}
                  <button
                    type="button"
                    onClick={() => onRequestPreview?.(it.productId)}
                    className="mt-1 inline-flex h-8 items-center rounded-lg border border-zinc-200 px-2 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50"
                    title="مشاهده جزئیات"
                  >
                    مشاهده جزئیات
                  </button>

                  <div className="text-xs text-zinc-500 mt-1">
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

                {/* بدون کنترل تعداد */}
                <div className="text-[11px] text-zinc-500">تعداد: ۱</div>
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
