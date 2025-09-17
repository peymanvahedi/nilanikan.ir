"use client";
import { useState } from "react";

type Branch = {
  id: number;
  title: string;
  address: string;
  neshanUrl: string;
  baladUrl: string;
  mapEmbedUrl?: string; // لینک واقعی iframe اگر داشتی
};

const BRANCHES: Branch[] = [
  {
    id: 1,
    title: "شعبه ۱",
    address: "گلسار، بلوار دیلمان، جنب کوچه آذر اندامی",
    neshanUrl: "https://nshn.ir/branch1",
    baladUrl: "https://balad.ir/branch1",
    // اگر لینک ایمبد واقعی داری اینجا بگذار، وگرنه خالی بگذار
    mapEmbedUrl: "",
  },
  {
    id: 2,
    title: "شعبه ۲",
    address: "خیابان مطهری، روبروی مسجد بادی‌الله، نبش کوچه ساغری‌سازان",
    neshanUrl: "https://nshn.ir/branch2",
    baladUrl: "https://balad.ir/branch2",
    mapEmbedUrl: "",
  },
  {
    id: 3,
    title: "شعبه ۳",
    address: "خیابان مطهری، بازار بزرگ مسگران",
    neshanUrl: "https://nshn.ir/branch3",
    baladUrl: "https://balad.ir/branch3",
    mapEmbedUrl: "",
  },
];

export default function FooterBranchesTabs() {
  const [active, setActive] = useState(0);
  const b = BRANCHES[active];

  // فقط وقتی iframe نمایش بده که لینک با http شروع شود
  const hasValidEmbed = !!b.mapEmbedUrl && /^https?:\/\//i.test(b.mapEmbedUrl);

  return (
    <div className="w-full">
      {/* تب‌ها */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        {BRANCHES.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-2 text-sm transition
              ${i === active
                ? "bg-pink-600 text-white"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"}`}
            aria-pressed={i === active}
          >
            {x.title}
          </button>
        ))}
      </div>

      {/* محتوای تب فعال */}
      <div className="pt-4 space-y-3">
        <p className="leading-7">
          <span className="font-semibold">{b.title}</span>{" — "}{b.address}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={b.neshanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-pink-50 px-3 py-2 text-pink-700 hover:bg-pink-100 text-sm"
          >
            🧭 نمایش در نشان
          </a>
          <a
            href={b.baladUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-pink-50 px-3 py-2 text-pink-700 hover:bg-pink-100 text-sm"
          >
            🗺️ نمایش در بلد
          </a>
        </div>

        {/* نقشه فقط در صورت داشتن لینک معتبر */}
        {hasValidEmbed && (
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-xl ring-1 ring-zinc-200">
              <iframe
                src={b.mapEmbedUrl}
                title={`map-${b.id}`}
                className="w-full h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
