"use client";

import { useEffect, useMemo, useState } from "react";

type Attr = { name: string; value: string };
type Variant = {
  id: number | string;
  sku?: string;
  price?: number;
  attrs?: Attr[]; // [{name:"size", value:"L"}, {name:"color", value:"Black"}]
  stock?: number;
};
type BundleItem = {
  id: number | string;
  title: string;
  image?: string;
  productId?: number | string;
  qtyMin?: number;         // حداقل تعداد برای این آیتم
  qtyMax?: number;         // حداکثر
  variants?: Variant[];    // لیست واریانت‌های قابل انتخاب
};

type Props = {
  bundleId: number | string;
  items: BundleItem[];
  cta?: string;
};

function fmtAttr(attrs?: Attr[]) {
  if (!attrs?.length) return "";
  return attrs.map(a => `${a.name}: ${a.value}`).join(" • ");
}

export default function BundleConfigurator({ bundleId, items, cta = "انتخاب آیتم‌ها و افزودن به سبد" }: Props) {
  // state انتخاب‌ها: { [itemId]: { variantId, qty } }
  const [sel, setSel] = useState<Record<string | number, { variantId?: string | number; qty: number }>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // مقداردهی اولیه تعداد/واریانت
  useEffect(() => {
    const init: Record<string | number, { variantId?: string | number; qty: number }> = {};
    for (const it of items) {
      const v0 = it.variants?.[0]?.id;
      init[it.id] = {
        variantId: v0,
        qty: Math.max(1, it.qtyMin ?? 1),
      };
    }
    setSel(init);
  }, [items]);

  const canSubmit = useMemo(() => {
    if (!items.length) return false;
    // برای هر آیتم باید واریانت انتخاب شده باشد
    return items.every(it => !!sel[it.id]?.variantId && (sel[it.id]?.qty ?? 0) > 0);
  }, [items, sel]);

  const onChangeVariant = (itemId: string | number, variantId: string | number) => {
    setSel(s => ({ ...s, [itemId]: { ...(s[itemId] ?? { qty: 1 }), variantId } }));
  };
  const onChangeQty = (itemId: string | number, qty: number, it: BundleItem) => {
    const min = Math.max(1, it.qtyMin ?? 1);
    const max = it.qtyMax ?? 99;
    const q = Math.min(Math.max(qty, min), max);
    setSel(s => ({ ...s, [itemId]: { ...(s[itemId] ?? {}), qty: q } }));
  };

  const addToCart = async () => {
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        bundleId,
        items: items.map(it => ({
          productId: it.productId ?? it.id,
          variantId: sel[it.id]?.variantId,
          qty: sel[it.id]?.qty ?? 1,
        })),
      };

      const r = await fetch("/api/cart/add-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `HTTP ${r.status}`);
      }

      // افزایش شمارنده‌ی سبد (سازگار با Header.tsx)
      const totalQty = payload.items.reduce((a, b) => a + (b.qty || 0), 0);
      window.dispatchEvent(new CustomEvent("cart:add", { detail: { qty: totalQty } }));

    } catch (e: any) {
      setErr(e?.message || "خطا در افزودن به سبد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((it) => (
        <div key={it.id} className="border rounded-xl p-3 flex gap-3 items-start">
          {it.image && (
            // اگر next/image داری می‌تونی تبدیل کنی؛ برای سادگی از img
            <img src={it.image} alt="" className="w-16 h-16 rounded object-cover" />
          )}

          <div className="flex-1">
            <div className="font-bold text-zinc-800 mb-1">{it.title}</div>

            {/* انتخاب واریانت */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-zinc-500">انتخاب واریانت:</label>
              <select
                className="h-9 px-2 rounded-lg border border-zinc-300"
                value={sel[it.id]?.variantId ?? ""}
                onChange={(e) => onChangeVariant(it.id, e.target.value)}
              >
                {!it.variants?.length && <option value="">—</option>}
                {it.variants?.map(v => (
                  <option key={String(v.id)} value={String(v.id)}>
                    {fmtAttr(v.attrs) || v.sku || `#${v.id}`}
                  </option>
                ))}
              </select>

              {/* تعداد */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border grid place-items-center"
                  onClick={() => onChangeQty(it.id, (sel[it.id]?.qty ?? 1) - 1, it)}
                >−</button>
                <input
                  type="number"
                  className="w-14 h-9 rounded-lg border border-zinc-300 text-center"
                  value={sel[it.id]?.qty ?? 1}
                  onChange={(e) => onChangeQty(it.id, Number(e.target.value), it)}
                  min={Math.max(1, it.qtyMin ?? 1)}
                  max={it.qtyMax ?? 99}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border grid place-items-center"
                  onClick={() => onChangeQty(it.id, (sel[it.id]?.qty ?? 1) + 1, it)}
                >+</button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {err && <div className="text-pink-700 bg-pink-50 border border-pink-200 rounded-lg p-2 text-sm">{err}</div>}

      <button
        disabled={!canSubmit || loading}
        onClick={addToCart}
        className="w-full h-12 rounded-2xl bg-pink-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "در حال افزودن..." : cta}
      </button>
    </div>
  );
}
