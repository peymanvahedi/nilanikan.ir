// src/components/BundleItemsTabs.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Attribute = { name?: string | null; value?: string | null };
type ProductLike = {
  id: number;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  price?: number | string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: string[] | null;
  description?: string | null;
  attributes?: Attribute[] | null;
  sizeTable?: string | null;
};

function toFaNum(v: any) {
  const n = Number(String(v ?? 0).toString().replace(/[^\d.-]/g, "")) || 0;
  try {
    return n.toLocaleString("fa-IR");
  } catch {
    return String(n);
  }
}

type Props = {
  products: ProductLike[];
  /** اختیاری: هر بار انتخاب ویژگی‌های یک محصول تغییر کند، به والد اطلاع می‌دهد */
  onAttributesChange?: (productId: number, selected: Attribute[]) => void;
};

export default function BundleItemsTabs({ products, onAttributesChange }: Props) {
  const normalized = useMemo(() => {
    return (products || []).map((p, i) => {
      const name = p.title || p.name || `آیتم ${i + 1}`;
      const img =
        p.image ||
        p.thumbnail ||
        (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ||
        "/placeholder.svg";
      return {
        id: p.id,
        name,
        price: p.price ?? null,
        image: img,
        images: p.images ?? [],
        description: p.description ?? null,
        attributes: (p.attributes || [])?.filter(Boolean) as Attribute[],
        sizeTable: p.sizeTable ?? null,
        slug: p.slug || null,
      };
    });
  }, [products]);

  const [activeProduct, setActiveProduct] = useState(0);
  const [activeTab, setActiveTab] = useState<"desc" | "attrs" | "size">("desc");

  // selectedAttrs: نگاشت ایندکس محصول => نگاشت ایندکس ویژگی => انتخاب شده/نشده
  const [selectedAttrs, setSelectedAttrs] = useState<
    Record<number, Record<number, boolean>>
  >({});

  // اطمینان از داشتن شیء خالی برای محصول فعال
  useEffect(() => {
    setSelectedAttrs((prev) => {
      if (prev[activeProduct]) return prev;
      return { ...prev, [activeProduct]: {} };
    });
  }, [activeProduct]);

  if (!normalized.length) return null;
  const current = normalized[Math.min(activeProduct, normalized.length - 1)];

  const toggleAttr = (prodIdx: number, attrIdx: number) => {
    setSelectedAttrs((prev) => {
      const productMap = { ...(prev[prodIdx] || {}) };
      productMap[attrIdx] = !productMap[attrIdx];
      const next = { ...prev, [prodIdx]: productMap };

      // کال‌بک به والد (اختیاری)
      if (onAttributesChange) {
        const selected: Attribute[] =
          (current.attributes || []).filter((_, i) => productMap[i]);
        onAttributesChange(current.id, selected);
      }
      return next;
    });
  };

  const isChecked = (prodIdx: number, attrIdx: number) =>
    !!selectedAttrs?.[prodIdx]?.[attrIdx];

  return (
    <section className="mt-10" dir="rtl">
      <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 mb-4">
        جزئیات آیتم‌های این باندل
      </h2>

      {/* نوار تب محصولات */}
      <div className="relative overflow-x-auto rounded-xl ring-1 ring-zinc-200 bg-white mb-4">
        <div className="flex min-w-max">
          {normalized.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProduct(i);
                setActiveTab("desc");
              }}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-l last:border-l-0
                ${
                  i === activeProduct
                    ? "bg-pink-50 text-pink-700"
                    : "text-zinc-700 hover:bg-zinc-50"
                }
                border-zinc-200`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* تب‌های محتوای یک محصول */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        {/* دکمه‌های تب */}
        <div className="flex gap-4 border-b border-zinc-200 mb-4">
          <button
            onClick={() => setActiveTab("desc")}
            className={`pb-2 text-sm font-bold ${
              activeTab === "desc"
                ? "text-pink-600 border-b-2 border-pink-600"
                : "text-zinc-600"
            }`}
          >
            توضیحات
          </button>
          <button
            onClick={() => setActiveTab("attrs")}
            className={`pb-2 text-sm font-bold ${
              activeTab === "attrs"
                ? "text-pink-600 border-b-2 border-pink-600"
                : "text-zinc-600"
            }`}
          >
            ویژگی‌ها
          </button>
          <button
            onClick={() => setActiveTab("size")}
            className={`pb-2 text-sm font-bold ${
              activeTab === "size"
                ? "text-pink-600 border-b-2 border-pink-600"
                : "text-zinc-600"
            }`}
          >
            جدول سایزبندی
          </button>
        </div>

        {/* محتوای تب‌ها */}
        {activeTab === "desc" && (
          <div>
            {current.description ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: String(current.description) }}
              />
            ) : (
              <p className="text-sm text-zinc-600">
                توضیحاتی برای این آیتم ثبت نشده است.
              </p>
            )}
          </div>
        )}

        {activeTab === "attrs" && (
          <div>
            {current.attributes?.length ? (
              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {current.attributes.map((a, idx) => {
                  const label =
                    (a?.name ? String(a.name) : "—") +
                    (a?.value ? `: ${a.value}` : "");
                  return (
                    <label
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs cursor-pointer"
                    >
                      <span className="text-zinc-700">{label || "—"}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-pink-600"
                        checked={isChecked(activeProduct, idx)}
                        onChange={() => toggleAttr(activeProduct, idx)}
                        aria-label={label || `attr-${idx}`}
                      />
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <p className="text-sm text-zinc-600">
                ویژگی‌ای برای این آیتم ثبت نشده است.
              </p>
            )}
          </div>
        )}

        {activeTab === "size" && (
          <div>
            {current.sizeTable ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: String(current.sizeTable) }}
              />
            ) : (
              <p className="text-sm text-zinc-600">
                جدول سایزبندی برای این آیتم موجود نیست.
              </p>
            )}
          </div>
        )}

        {/* ستون تصویر و قیمت */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-4">
          <div className="space-y-3">
            <div className="relative aspect-[4/5] w-full rounded-xl ring-1 ring-zinc-200 overflow-hidden">
              <Image
                src={current.image || "/placeholder.svg"}
                alt={current.name || "محصول"}
                fill
                className="object-cover"
                sizes="(min-width:768px) 200px, 100vw"
              />
            </div>
            {current.price != null && (
              <div className="text-sm">
                <span className="text-zinc-500">قیمت واحد:</span>{" "}
                <b className="text-zinc-900">{toFaNum(current.price)}</b>{" "}
                <span className="text-xs text-zinc-500">تومان</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
