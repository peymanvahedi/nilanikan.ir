// src/components/AttributePicker.tsx
"use client";

import React from "react";

/* ===== Types ===== */
export type AttributeOption = {
  id?: number | string | null;
  name?: string | null;
  label?: string | null;
  value?: string | null;
  color?: string | null; // اختیاری
};

export type AttributeValue = {
  attribute?: string | null;   // نام گروه ویژگی (مثلاً رنگ/سایز)
  name?: string | null;
  values?: AttributeOption[] | string;
  options?: AttributeOption[] | string;
  items?: AttributeOption[] | string;
  choices?: AttributeOption[] | string;
  allowed_values?: AttributeOption[] | string;
  value_list?: AttributeOption[] | string;
  value?: string | null;       // CSV/متن
};

export type SelectedAttrs = Record<
  string,
  { id?: number | string | null; attribute?: string | null; value?: string | null }
>;

type Props = {
  attributes: AttributeValue[];
  selected: SelectedAttrs;
  onChange: (next: SelectedAttrs) => void;

  /** فقط برای پاپ‌آپ: رنگ‌ها به صورت متن نمایش داده شوند (بدون دایره/سواچ) */
  renderColorAsText?: boolean;
};

function listifyOptions(x: any): AttributeOption[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (typeof x === "string") {
    // اگر CSV بود
    const arr = x.split(/[,|/،]\s*/).map((s) => s.trim()).filter(Boolean);
    return arr.map((t) => ({ id: t, label: t, name: t, value: t }));
  }
  return [];
}

function labelOf(opt: AttributeOption): string {
  return (
    String(opt.label ?? opt.name ?? opt.value ?? "").trim() || ""
  );
}

function normName(name?: string | null): string {
  return String(name ?? "").trim();
}

function isColorName(name?: string | null): boolean {
  const n = normName(name).toLowerCase();
  return ["color", "رنگ", "لون", "rang"].some((k) => n.includes(k));
}

/* ===== UI ===== */
export default function AttributePicker({
  attributes,
  selected,
  onChange,
  renderColorAsText = false,
}: Props) {
  const groups = (attributes || [])
    .map((g) => {
      const title = normName(g.attribute ?? g.name ?? "ویژگی");
      const opts =
        listifyOptions(
          g.values ?? g.options ?? g.items ?? g.choices ?? g.allowed_values ?? g.value_list ?? g.value
        ) || [];
      const normalized = opts
        .map((o) => {
          const label = labelOf(o);
          if (!label) return null;
          return {
            id: o.id ?? o.value ?? label,
            label,
            color: (o as any).color ?? null,
          } as AttributeOption;
        })
        .filter(Boolean) as AttributeOption[];
      return { title, options: normalized };
    })
    .filter((g) => g.options.length > 0);

  function toggle(name: string, opt: AttributeOption) {
    const next: SelectedAttrs = { ...selected };
    next[name] = { id: opt.id ?? null, attribute: name, value: opt.label ?? null };
    onChange(next);
  }

  if (groups.length === 0) return null;

  return (
    <div className="space-y-3">
      {groups.map((g, i) => {
        const picked = selected[g.title]?.id ?? selected[g.title]?.value;
        const colorMode = isColorName(g.title) && renderColorAsText; // ← فقط متن برای رنگ در پاپ‌آپ
        return (
          <div key={`${g.title}-${i}`}>
            <div className="mb-1 text-xs font-bold text-zinc-700">{g.title}</div>
            <div className="flex flex-wrap gap-2">
              {g.options.map((opt, oi) => {
                const isActive =
                  picked != null &&
                  String(picked) === String(opt.id ?? opt.label ?? "");

                // حالت پیش‌فرض: چیپ ساده
                let content: React.ReactNode = (
                  <span className="px-3">{opt.label}</span>
                );

                // اگر رنگ و خواسته باشیم فقط متن؛ همون content باقی می‌مونه
                // اگر رنگ باشد ولی اجازهٔ سواچ داشته باشیم:
                if (isColorName(g.title) && !colorMode) {
                  const swatch =
                    typeof opt.color === "string" && opt.color
                      ? opt.color
                      : undefined;
                  content = (
                    <>
                      {!swatch ? null : (
                        <span
                          className="inline-block h-3 w-3 rounded-full ring-1 ring-zinc-300"
                          style={{ background: swatch }}
                        />
                      )}
                      <span className="px-2">{opt.label}</span>
                    </>
                  );
                }

                return (
                  <button
                    key={`opt-${i}-${oi}-${String(opt.id ?? opt.label)}`}
                    type="button"
                    onClick={() => toggle(g.title, opt)}
                    className={`inline-flex items-center h-9 rounded-lg border px-2 text-sm font-bold transition
                      ${isActive
                        ? "border-pink-600 bg-pink-50 text-pink-700"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                    aria-pressed={isActive}
                    title={`${g.title}: ${opt.label}`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { AttributePicker };
