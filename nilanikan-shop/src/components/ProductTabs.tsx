// src/components/ProductTabs.tsx
import React, { useState } from "react";

/**
 * تب‌بندی پایین صفحه محصول: ویژگی‌ها | توضیحات | جدول سایز | (اختیاری) نظرات
 * TailwindCSS + راست‌چین. آماده برای Next.js (app یا pages router)
 */

export interface SizeChart {
  headers: string[];
  rows: Array<Array<string | number>>;
  note?: string;
}

export interface ProductTabsProps {
  features?: string[];
  /**
   * HTML ایمن‌سازی‌شده یا خام (Sanitizer سبک داخلی دارد؛
   * برای پروداکشن DOMPurify/sanitize-html پیشنهاد می‌شود)
   */
  description?: string;
  sizeChart?: SizeChart;
  reviewsEnabled?: boolean;
  initialTab?: "features" | "description" | "size" | "reviews";
}

type TabId = "features" | "description" | "size" | "reviews";

const ProductTabs: React.FC<ProductTabsProps> = ({
  features = [],
  description = "",
  sizeChart,
  reviewsEnabled = false,
  initialTab,
}) => {
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "features", label: "ویژگی‌ها" },
    { id: "description", label: "توضیحات" },
  ];
  if (sizeChart) tabs.push({ id: "size", label: "جدول سایز" });
  if (reviewsEnabled) tabs.push({ id: "reviews", label: "نظرات" });

  // مقدار اولیه‌ی امن برای state (هرگز undefined نمی‌شود)
  const defaultTab: TabId =
    initialTab && tabs.some((t) => t.id === initialTab)
      ? (initialTab as TabId)
      : ((tabs[0]?.id ?? "features") as TabId);

  const [active, setActive] = useState<TabId>(defaultTab);

  return (
    <div dir="rtl" className="mt-10">
      {/* Tabs header */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={[
              "px-4 py-2 text-sm md:text-base rounded-t-2xl border border-b-0 transition-all duration-150",
              active === t.id
                ? "bg-white shadow-sm -mb-px border-gray-200 font-semibold"
                : "bg-gray-50 hover:bg-white border-transparent text-gray-700",
            ].join(" ")}
            aria-selected={active === t.id}
            role="tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabs content */}
      <div className="border border-gray-200 rounded-b-2xl rounded-tr-2xl p-4 md:p-6 bg-white">
        {active === "features" && (
          <ul className="space-y-2 text-sm md:text-base leading-7 list-none">
            {features.length === 0 && (
              <li className="text-gray-500">ویژگی‌ای ثبت نشده است.</li>
            )}
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(16 185 129)" }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {active === "description" && (
          <div
            className="prose prose-sm md:prose-base prose-slate max-w-none [&_p]:mb-3"
            // هشدار: برای پروداکشن از کتابخانه‌های معتبر Sanitization استفاده کنید
            dangerouslySetInnerHTML={{ __html: lightSanitize(description) }}
          />
        )}

        {active === "size" && sizeChart && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base border-collapse">
              <thead>
                <tr>
                  {sizeChart.headers?.map((h, i) => (
                    <th
                      key={i}
                      className="border border-gray-200 bg-gray-50 p-2 text-right whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeChart.rows?.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="border border-gray-200 p-2 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sizeChart.note && (
              <p className="text-xs text-gray-500 mt-2">{sizeChart.note}</p>
            )}
          </div>
        )}

        {active === "reviews" && (
          <div className="text-sm text-gray-600">
            {/* این بخش را بعداً به سیستم نظرات متصل کنید */}
            <p>سیستم نظرات به‌زودی افزوده می‌شود.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;

// ---- Utilities ----
/** Sanitizer سبک برای حذف اسکریپت‌ها و handlerهای رویداد */
function lightSanitize(html?: string): string {
  if (!html) return "";
  // استفاده از RegExp شیئی تا مشکل TSX با /<\\/script>/ پیش نیاید
  return html
    .replace(new RegExp("<script[^>]*>[\\s\\S]*?<\\/script>", "gi"), "")
    .replace(new RegExp(" on\\w+\\s*=\\s*\\\"[^\\\"]*\\\"", "gi"), "")
    .replace(new RegExp(" on\\w+\\s*=\\s*'[^']*'", "gi"), "")
    .replace(new RegExp(" on\\w+\\s*=\\s*[^\\s>]+", "gi"), "");
}

/**
 * نمونه استفاده:
 *
 * import ProductTabs from "@/components/ProductTabs";
 *
 * <ProductTabs
 *   features={product.features}             // string[]
 *   description={product.descriptionHtml}   // string (HTML)
 *   sizeChart={product.sizeChart}           // { headers: string[], rows: (string|number)[][], note?: string }
 *   reviewsEnabled={false}
 * />
 */
