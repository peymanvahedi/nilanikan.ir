"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Page() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bundles/?limit=20`);
        if (!res.ok) throw new Error("خطا در دریافت باندل‌ها");
        const data = await res.json();

        const mapped =
          data?.results?.map((b: any) => ({
            id: b.id,
            name: b.title,
            slug: b.slug,
            price: b.price ?? 0,
            image: b.image ?? b.products?.[0]?.image,
          })) ?? [];

        setBundles(mapped);
      } catch (e: any) {
        setError(e.message || "مشکل در دریافت داده");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-extrabold mb-6">ست‌ها</h1>

      {bundles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {bundles.map((b) => (
            <Link
              key={b.id}
              href={`/bundle/${b.slug ?? b.id}`}
              className="block rounded-xl border border-slate-200 bg-white shadow hover:shadow-md transition overflow-hidden"
            >
              <div className="relative aspect-square w-full bg-slate-100">
                <Image
                  src={b.image || "/placeholder-bundle.png"}
                  alt={b.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <h2 className="font-bold text-sm text-slate-800 line-clamp-2">
                  {b.name}
                </h2>
                <p className="mt-1 text-pink-600 font-semibold text-sm">
                  {new Intl.NumberFormat("fa-IR").format(b.price)} تومان
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-6 text-slate-500">هیچ باندلی پیدا نشد.</div>
      )}
    </main>
  );
}
