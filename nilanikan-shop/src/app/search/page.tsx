// app/search/page.tsx
import Image from "next/image";
import { headers } from "next/headers";

type Product = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  image?: string;
  href: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams?.q || "").trim();
  let items: Product[] = [];

  if (q) {
    // 1) اگر BASE_URL محیطی داری، از همون استفاده کن
    const envBase =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "";

    // 2) در غیر این صورت از هدرها آدرس مطلق بساز (نیاز به await)
    let base = envBase.replace(/\/$/, "");
    if (!base) {
      const h = await headers(); // ⬅️ اینجا await لازم بود
      const proto = h.get("x-forwarded-proto") ?? "http";
      const host =
        h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
      base = `${proto}://${host}`;
    }

    try {
      const res = await fetch(
        `${base}/api/search?q=${encodeURIComponent(q)}&limit=50`,
        { cache: "no-store" }
      );
      const data = await res.json();
      items = data.items || [];
    } catch {
      items = [];
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6" dir="rtl">
      <h1 className="text-xl font-bold mb-4">نتایج جست‌وجو برای: «{q}»</h1>

      {(!q || items.length === 0) && (
        <p className="text-zinc-600">چیزی پیدا نشد.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <a
            key={p.id}
            href={p.href}
            className="rounded-2xl border border-zinc-200 p-3 hover:shadow-md transition"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-zinc-50">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.title}
                  width={600}
                  height={600}
                  className="object-cover w-full h-full"
                />
              ) : null}
            </div>
            <div className="mt-2">
              <h3 className="font-semibold line-clamp-2">{p.title}</h3>
              {p.price != null && (
                <div className="text-pink-600 font-bold mt-1">
                  {p.price.toLocaleString("fa-IR")} تومان
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
