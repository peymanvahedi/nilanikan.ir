"use client";
import { useState } from "react";
// فقط تایپ را با type-only ایمپورت کن و از alias استفاده نکن
import type { QueryState } from "../../lib/catalog/query";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

export function FilterPanel({
  value,
  onChange,
}: {
  value: QueryState;
  onChange: (v: QueryState) => void;
}) {
  const [open, setOpen] = useState(true);

  const toggle = (
    listKey: keyof Pick<QueryState, "category" | "types" | "colors" | "sizes">,
    v: string
  ) => {
    const set = new Set(value[listKey] as string[]);
    set.has(v) ? set.delete(v) : set.add(v);
    onChange({ ...value, page: 1, [listKey]: Array.from(set) } as QueryState);
  };

  const clearAll = () =>
    onChange({
      ...value,
      q: "",
      category: [],
      types: [],
      colors: [],
      sizes: [],
      minPrice: undefined,
      maxPrice: undefined,
      page: 1,
    });

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          فیلترهای پیشرفته
        </h2>
        <button onClick={() => setOpen((o) => !o)} className="text-sm">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-1">جستجو</label>
            <input
              value={value.q}
              onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
              placeholder="نام محصول، کد، …"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          {/* Categories */}
          <FilterSection title="دسته‌بندی">
            {["پسرانه", "دخترانه", "نوزادی", "نوجوان"].map((c) => (
              <CheckPill
                key={c}
                active={value.category.includes(c)}
                onClick={() => toggle("category", c)}
              >
                {c}
              </CheckPill>
            ))}
          </FilterSection>

          {/* Types */}
          <FilterSection title="نوع محصول (ست‌ها هم)">
            {["تک", "ست", "سرهمی", "پیراهن", "شلوار", "هودی"].map((t) => (
              <CheckPill
                key={t}
                active={value.types.includes(t)}
                onClick={() => toggle("types", t)}
              >
                {t}
              </CheckPill>
            ))}
          </FilterSection>

          {/* Colors */}
          <FilterSection title="رنگ">
            {["سفید", "مشکی", "آبی", "صورتی", "خاکستری", "قرمز"].map((c) => (
              <CheckPill
                key={c}
                active={value.colors.includes(c)}
                onClick={() => toggle("colors", c)}
              >
                {c}
              </CheckPill>
            ))}
          </FilterSection>

          {/* Sizes */}
          <FilterSection title="سایز">
            {[
              "0-3",
              "3-6",
              "6-9",
              "9-12",
              "12-18",
              "18-24",
              "2-3",
              "3-4",
              "4-5",
              "5-6",
              "7-8",
              "9-10",
            ].map((s) => (
              <CheckPill
                key={s}
                active={value.sizes.includes(s)}
                onClick={() => toggle("sizes", s)}
              >
                {s}
              </CheckPill>
            ))}
          </FilterSection>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-1">قیمت (تومان)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                placeholder="حداقل"
                className="w-1/2 rounded-xl border px-3 py-2"
                value={value.minPrice ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  })
                }
              />
              <span className="opacity-60">تا</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="حداکثر"
                className="w-1/2 rounded-xl border px-3 py-2"
                value={value.maxPrice ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={clearAll} className="text-sm flex items-center gap-1">
              <X className="h-4 w-4" /> حذف همه فیلترها
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CheckPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm ${
        active ? "border-black" : "border-gray-300 opacity-80"
      }`}
    >
      {children}
    </button>
  );
}
