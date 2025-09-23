// src/app/bundle/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { get, endpoints, absolutizeMedia } from "../../lib/api";

type BundleListItem = {
  id: number;
  slug: string;
  title?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  images?: string[];
};

/** نوار راهنمای ساده و همیشه‌قابل‌مشاهده */
function HowToBanner() {
  const steps = [
    "روی یک باندل کلیک کن",
    "آیتم‌های دلخواهت را انتخاب کن",
    "ویژگی‌ها (سایز/رنگ) را بزن",
    "افزودن به سبد خرید",
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % steps.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      dir="rtl"
      className="mb-5 rounded-2xl border border-yellow-300 bg-yellow-50 p-3 sm:p-4 shadow-sm"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-yellow-900">
        {/* آیکن کوچک */}
        <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 animate-pulse">
          <path fill="currentColor" d="M8 5v14l11-7z" />
        </svg>

        {/* متن کاملاً ساده و بدون افکت پنهان‌کننده */}
        <p className="m-0 text-sm sm:text-base font-extrabold">
          <span className="me-1">راهنما:</span>
          <span>{steps[i]}</span>
        </p>

        <span className="ms-auto hidden sm:inline-flex items-center rounded-lg bg-white/70 px-2 py-0.5 text-[11px] font-bold text-yellow-800 ring-1 ring-yellow-300">
          مرحله {i + 1}/{steps.length}
        </span>
      </div>
    </div>
  );
}

export default function BundlesPage() {
  const [items, setItems] = useState<BundleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await get<BundleListItem[]>(endpoints.bundles);
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "خطا در دریافت باندل‌ها");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        در حال بارگذاری…
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
        خطا: {err}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      <h1 className="mb-2 text-xl font-extrabold text-zinc-900">باندل‌ها</h1>

      {/* نوار راهنما */}
      <HowToBanner />

      {items.length === 0 ? (
        <div className="text-sm text-zinc-500">فعلاً باندلی ثبت نشده است.</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((b) => {
            const title = b.title || b.name || "باندل";
            const cover = absolutizeMedia(b.image || b.images?.[0]) || "/placeholder.svg";

            return (
              <li key={b.id} className="overflow-hidden rounded-xl ring-1 ring-zinc-200 bg-white transition hover:shadow-md">
                <Link href={`/bundle/${encodeURIComponent(b.slug)}`} className="block">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={cover}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  </div>
                  <div className="p-3">
                    <div className="truncate font-bold text-zinc-900">{title}</div>
                    {b.description ? (
                      <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{b.description}</div>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
