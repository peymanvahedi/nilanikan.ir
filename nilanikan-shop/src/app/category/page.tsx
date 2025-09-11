import Link from "next/link";
import { get, endpoints } from "@/lib/api";
import SafeImg from "@/components/SafeImg";

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
};

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

function resolveImage(src?: string | null, seed?: string) {
  if (!src) return `https://picsum.photos/seed/${encodeURIComponent(seed || "cat")}/800`;
  return src.startsWith("http") ? src : `${BASE}${src}`;
}

export default async function CategoriesPage() {
  // خواندن از بک‌اند: /api/categories/
  const data = await get(endpoints.categories);
  const items: Category[] = Array.isArray(data) ? data : data.results || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-pink-600 mb-6">دسته‌بندی‌ها</h1>

      {items.length === 0 ? (
        <p className="text-zinc-600">فعلاً دسته‌بندی نداریم—از پنل ادمین اضافه کن و صفحه را رفرش کن.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="block border rounded-2xl overflow-hidden shadow hover:shadow-lg transition bg-white"
            >
              <div className="aspect-square overflow-hidden">
                <SafeImg
                  src={resolveImage(c.image, c.slug || c.name)}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-center font-bold text-zinc-800">{c.name}</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
