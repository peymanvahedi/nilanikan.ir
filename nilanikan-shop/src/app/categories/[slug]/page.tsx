import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { get, endpoints } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  slug?: string;
  price: number;
  discount_price?: number | null;
  image?: string | null;
  category?: any;
  category_id?: number;
  category_slug?: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function resolveImage(src?: string | null, seed?: string) {
  if (!src) return `https://picsum.photos/seed/${encodeURIComponent(seed || "prod")}/800`;
  return src.startsWith("http") ? src : `${BASE}${src}`;
}

async function fetchProductsByCategorySlug(slug: string): Promise<Product[]> {
  // 1) رایج: فیلتر با slug
  try {
    const data = await get(`${endpoints.products}?category=${encodeURIComponent(slug)}`);
    const items = Array.isArray(data) ? data : data.results || [];
    return items as Product[];
  } catch {}

  // 2) اگر slug جواب نداد: فیلتر با category_id
  try {
    const catDetail = await get(`${endpoints.categories}${slug}/`); // ممکن است 404 بدهد
    const catId = catDetail?.id;
    if (catId) {
      const data = await get(`${endpoints.products}?category_id=${catId}`);
      const items = Array.isArray(data) ? data : data.results || [];
      return items as Product[];
    }
  } catch {}

  // 3) آخرین راه: همه محصولات و فیلتر سمت کلاینت
  try {
    const all = await get(endpoints.products);
    const items: Product[] = Array.isArray(all) ? all : all.results || [];
    return items.filter(
      (p) =>
        p?.category?.slug === slug ||
        p?.category_slug === slug ||
        (typeof p?.category === "string" && p.category === slug)
    );
  } catch {}

  return [];
}

const categoryTitleFallback: Record<string, string> = {
  girls: "دخترانه",
  boys: "پسرانه",
  baby: "نوزادی",
  accessories: "اکسسوری",
};

export default async function CategoryPage({
  params,
}: {
  // اگر پروژه‌ات Next 15 است و params بصورت Promise می‌آید
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // گرفتن عنوان کتگوری (اگر API از slug پشتیبانی کند)
  let title: string | undefined = categoryTitleFallback[slug];
  try {
    const detail = await get(`${endpoints.categories}${slug}/`);
    title = detail?.name || title;
  } catch {
    // اگر 404 شد، از fallback استفاده می‌کنیم
  }

  const products = await fetchProductsByCategorySlug(slug);

  if (!title && products.length === 0) {
    // نه عنوان داریم نه محصول → 404
    return notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-pink-600 mb-6">
        {title ? `محصولات ${title}` : `محصولات دسته: ${slug}`}
      </h1>

      {products.length === 0 ? (
        <p className="text-zinc-600">محصولی در این دسته‌بندی یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.discount_price ?? p.price}
              image={resolveImage(p.image, p.slug || String(p.id))}
            />
          ))}
        </div>
      )}
    </main>
  );
}
