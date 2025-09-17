// src/components/AttributePicker.tsx
"use client";

import { useMemo } from "react";

export type AttributeValue = {
  id: number;
  attribute: string;     // مثلا "Color" یا "Size"
  value: string;         // مثلا "Red" یا "M"
  slug: string;
  color_code?: string | null;
};

export type SelectedAttrs = Record<string, AttributeValue | null>;

export default function AttributePicker({
  attributes = [],
  selected,
  onChange,
}: {
  attributes: AttributeValue[];
  selected: SelectedAttrs;
  onChange: (next: SelectedAttrs) => void;
}) {
  const groups = useMemo(() => {
    const m = new Map<string, AttributeValue[]>();
    for (const a of attributes) {
      const key = a.attribute || "ویژگی";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(a);
    }
    return Array.from(m.entries());
  }, [attributes]);

  const setPick = (attrName: string, av: AttributeValue) => {
    onChange({ ...selected, [attrName]: av });
  };

  if (!attributes?.length) return null;

  return (
    <div className="space-y-4" dir="rtl">
      {groups.map(([attrName, values]) => (
        <div key={attrName} className="space-y-2">
          <div className="text-sm font-bold text-zinc-800">{attrName}</div>
          <div className="flex flex-wrap gap-2">
            {values.map((av) => {
              const picked = selected[attrName]?.id === av.id;
              const isColor = !!av.color_code;
              return (
                <button
                  key={av.id}
                  type="button"
                  data-testid="product-option" // اضافه شده برای تست
                  onClick={() => setPick(attrName, av)}
                  className={[
                    "h-9 rounded-lg px-3 text-xs font-bold border transition",
                    picked
                      ? "border-pink-600 text-pink-700 bg-pink-50"
                      : "border-zinc-300 text-zinc-700 hover:border-zinc-400",
                    isColor ? "pr-2 pl-3" : "",
                  ].join(" ")}
                  aria-pressed={picked}
                  title={isColor ? `${av.value} ${av.color_code ?? ""}` : av.value}
                >
                  {isColor ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-4 h-4 rounded-full border"
                        style={{ backgroundColor: av.color_code || undefined }}
                      />
                      <span>{av.value}</span>
                    </span>
                  ) : (
                    av.value
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
