"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function ImageGallery({
  images,
  alt = "تصویر",
  thumbsSide = "right", // right | left | bottom
}: {
  images?: Array<string | null | undefined>;
  alt?: string;
  thumbsSide?: "right" | "left" | "bottom";
}) {
  // لیست امن: حذف null/undefined و جایگزینی با یک تصویر پیش‌فرض اگر خالی بود
  const list = useMemo(() => {
    const cleaned = (images ?? []).filter(Boolean) as string[];
    return cleaned.length ? cleaned : ["https://picsum.photos/seed/placeholder/800"];
  }, [images]);

  const [active, setActive] = useState(0);
  const sideCols =
    thumbsSide === "bottom" ? "flex-col" : thumbsSide === "left" ? "md:flex-row-reverse" : "md:flex-row";

  return (
    <div className={`flex ${sideCols} gap-4`}>
      {/* تصویر اصلی */}
      <div className="relative flex-1 aspect-square rounded-xl overflow-hidden ring-1 ring-zinc-200 bg-white">
<Image 
  src={list[active] ?? "https://picsum.photos/seed/placeholder/800"} 
  alt={alt} 
  fill 
  className="object-contain" 
/>
      </div>

      {/* تصاویر کوچک */}
      <div className={`${thumbsSide === "bottom" ? "flex-row" : "md:flex-col"} flex gap-2 overflow-auto no-scrollbar md:w-24`}>
        {list.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg border-2 ${
              i === active ? "border-pink-600" : "border-transparent"
            }`}
            aria-label={`تصویر ${i + 1}`}
          >
            <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-contain bg-white" />
          </button>
        ))}
      </div>
    </div>
  );
}
