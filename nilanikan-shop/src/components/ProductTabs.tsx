// src/components/ProductTabs.tsx
"use client";

import { useMemo, useState } from "react";
import ProductReviews from "@/components/ProductReviews";

type SizeChart = {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
};

type AttributeValue = {
  id: number;
  attribute: string;     // مثل "Color" یا "Size"
  value: string;         // مثل "Red" یا "M"
  slug: string;
  color_code?: string | null;
};

type Props = {
  /** لیست ویژگی‌ها؛ می‌تواند آرایه‌ای از آبجکت‌ها یا رشته‌های ساده باشد */
  features?: Array<AttributeValue | string>;
  /** HTML یا متن توضیحات (اگر متن ساده است، همان‌طور پاس بده) */
  description?: string | null;
  /** جدول سایز (اختیاری) */
  sizeChart?: SizeChart | null;
  /** فعال‌سازی بخش نظرات */
  reviewsEnabled?: boolean;
  /** تب ابتدایی (اگر تب وجود نداشته باشد، به اولین تب موجود می‌رود) */
  initialTab?: "features" | "description" | "size" | "reviews";
  /** 👇 با این prop می‌توان تب ویژگی‌ها را کلاً پنهان کرد */
  showFeatures?: boolean;

  /** برای اتصال دیدگاه‌ها به محصول */
  productId: number | string;
  productSlug: string;
};

function isAttrObj(x: any): x is AttributeValue {
  return x && typeof x === "object" && "attribute" in x && "value" in x;
}

export default function ProductTabs({
  features = [],
  description = "",
  sizeChart = null,
  reviewsEnabled = false,
  initialTab = "features",
  showFeatures = true,
  productId,
  productSlug,
}: Props) {
  // تب‌ها را بر اساس داده‌ها و prop ها می‌سازیم
  const tabs = useMemo(() => {
    const out: { id: "features" | "description" | "size" | "reviews"; label: string }[] = [];
    if (showFeatures) {
      out.push({ id: "features", label: "ویژگی‌ها" });
    }
    if (description && String(description).trim()) {
      out.push({ id: "description", label: "توضیحات" });
    }
    if (sizeChart && Array.isArray(sizeChart.headers) && Array.isArray(sizeChart.rows)) {
      out.push({ id: "size", label: "جدول سایز" });
    }
    if (reviewsEnabled) {
      out.push({ id: "reviews", label: "دیدگاه‌ها" });
    }
    // اگر داده‌ای نبود، حداقل توضیحات را نشان نده (out خالی بماند)
    return out;
  }, [showFeatures, description, sizeChart, reviewsEnabled]);

  // تب اولیه اگر در بین تب‌های موجود نباشد، به اولین تب موجود می‌رویم
  const resolvedInitial =
    tabs.find((t) => t.id === initialTab)?.id ?? (tabs[0]?.id ?? "description");

  const [tab, setTab] = useState<"features" | "description" | "size" | "reviews">(resolvedInitial);

  const normFeatures = useMemo(() => {
    // خروجی یکنواخت: [{label, value, color_code?}, ...]
    const out: { label: string; value: string; color_code?: string | null }[] = [];
    if (!showFeatures) return out; // اگر پنهان است، چیزی برنگردان
    for (const f of features) {
      if (isAttrObj(f)) {
        out.push({ label: f.attribute, value: f.value, color_code: f.color_code ?? null });
      } else if (typeof f === "string") {
        // تلاش برای جدا کردن label: value
        const m = f.match(/^\s*([^:：]+)\s*[:：]\s*(.+)\s*$/);
        if (m) out.push({ label: m[1], value: m[2] });
        else out.push({ label: "ویژگی", value: f });
      }
    }
    return out;
  }, [features, showFeatures]);

  return (
    <div dir="rtl">
      {/* سر تب‌ها */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-2 border-b border-zinc-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${
                tab === t.id
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
              aria-selected={tab === t.id}
              aria-controls={`tab-${t.id}`}
              role="tab"
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* محتوای تب‌ها */}
      <div className="pt-4" role="tabpanel">
        {/* ویژگی‌ها */}
        {showFeatures && tab === "features" && (
          <>
            {normFeatures.length > 0 ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {normFeatures.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-2 min-w-0">
                    <dt className="text-sm text-zinc-500 w-28 shrink-0">{a.label}</dt>
                    <dd className="text-sm text-zinc-800 break-words">
                      {a.color_code ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block w-4 h-4 rounded-full border"
                            style={{ backgroundColor: a.color_code || undefined }}
                            title={a.color_code || undefined}
                          />
                          <span>{a.value}</span>
                        </span>
                      ) : (
                        a.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="text-sm text-zinc-500">ویژگی‌ای ثبت نشده است.</div>
            )}
          </>
        )}

        {/* توضیحات */}
        {tab === "description" && description && (
          <div
            id="tab-description"
            className="prose prose-zinc max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
            // اگر description HTML باشد، به‌صورت امن رندر شود (فرض بر قابل‌اعتماد بودن منبع)
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {/* جدول سایز */}
        {tab === "size" && sizeChart && (
          <div id="tab-size" className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50">
                  {(sizeChart.headers || []).map((h, i) => (
                    <th key={i} className="px-3 py-2 text-right font-bold border-b border-zinc-200">
                      {String(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(sizeChart.rows || []).map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} className="px-3 py-2 border-b border-zinc-100">
                        {String(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sizeChart.note && (
              <p className="mt-2 text-xs text-zinc-500">{sizeChart.note}</p>
            )}
          </div>
        )}

        {/* دیدگاه‌ها */}
        {tab === "reviews" && reviewsEnabled && (
          <div id="tab-reviews">
            <ProductReviews productId={productId} productSlug={productSlug} />
          </div>
        )}

        {/* وقتی هیچ تب/داده‌ای نداریم */}
        {tabs.length === 0 && (
          <div className="text-sm text-zinc-500">اطلاعاتی برای نمایش وجود ندارد.</div>
        )}
      </div>
    </div>
  );
}
