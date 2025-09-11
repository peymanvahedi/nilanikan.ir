// src/app/bundle/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { get, endpoints, absolutizeMedia } from "../../lib/api"; // ← مسیر نسبی درست

type BundleListItem = {
  id: number;
  slug: string;
  title?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  images?: string[];
};

export default function BundlesPage() {
  const [items, setItems] = useState<BundleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // فرض: GET /api/bundles/ لیست باندل‌ها را برمی‌گرداند
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
    return () => {
      alive = false;
    };
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
      <h1 className="mb-6 text-xl font-extrabold">باندل‌ها</h1>

      {items.length === 0 ? (
        <div className="text-sm text-zinc-500">فعلاً باندلی ثبت نشده است.</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((b) => {
            const title = b.title || b.name || "باندل";
            const cover =
              absolutizeMedia(b.image || b.images?.[0]) ||
              "/placeholder.svg";

            return (
              <li key={b.id} className="overflow-hidden rounded-xl ring-1 ring-zinc-200 bg-white">
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
                      <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {b.description}
                      </div>
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
