// src/app/search/page.tsx
import ProductCard from "@/components/ProductCard";
import { get, endpoints, buildQuery } from "@/lib/api";
import type { Metadata } from "next";

type ProductListItem = {
  id: number | string;
  slug: string;
  name: string;
  price: number;
  discount_price?: number | null;
  image?: string | null;
  images?: Array<string | null> | null;
  gallery?: Array<{ image?: string | null }> | null;
};

type ProductsResponse =
  | { results: ProductListItem[]; count?: number; next?: string | null; previous?: string | null }
  | ProductListItem[];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جستجو | نیلانیکان",
  description: "نتایج جستجوی محصولات فروشگاه نیلانیکان",
};

function listify(x: ProductsResponse): ProductListItem[] {
  return Array.isArray(x) ? x : Array.isArray(x.results) ? x.results : [];
}
function getCount(x: ProductsResponse): number | undefined {
  return Array.isArray(x) ? x.length : x.count;
}

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const brand = typeof searchParams.brand === "string" ? searchParams.brand : undefined;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const page = Number(searchParams.page ?? "1") || 1;
  const limit = Number(searchParams.limit ?? "24") || 24;

  const query = buildQuery({
    page,
    limit,
    ...(q ? { search: q } : {}),
    ...(brand ? { brand } : {}),
    ...(category ? { category } : {}),
  });

  const data = await get<ProductsResponse>(`${endpoints.products}${query}`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });

  const items = listify(data);
  const total = getCount(data);

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      <header className="mb-6 space-y-3">
        <h1 className="text-xl md:text-2xl font-bold">جستجو</h1>

        {/* نوار جستجو/فیلتر */}
        <form method="get" className="flex flex-wrap gap-2 text-sm">
          <input
            name="q"
            defaultValue={q}
            placeholder="نام محصول، کلمه کلیدی…"
            className="h-9 rounded-lg border border-zinc-300 px-3 w-56"
          />
          <input
            name="brand"
            defaultValue={brand}
            placeholder="برند"
            className="h-9 rounded-lg border border-zinc-300 px-3 w-40"
          />
          <input
            name="category"
            defaultValue={category}
            placeholder="دسته‌بندی"
            className="h-9 rounded-lg border border-zinc-300 px-3 w-40"
          />
          <button
            className="h-9 rounded-lg bg-pink-600 px-4 font-bold text-white hover:bg-pink-700"
            type="submit"
          >
            جستجو
          </button>
        </form>
      </header>

      {q && (
        <p className="mb-4 text-xs text-zinc-500">
          نتیجهٔ جستجو برای: <span className="font-semibold">{q}</span>
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">موردی یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard
              key={p.slug ?? p.id}
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={Number(p.price)}
              discount_price={typeof p.discount_price === "number" ? p.discount_price : undefined}
              image={p.image ?? undefined}
              images={p.images ?? undefined}
              gallery={p.gallery ?? undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
        {page > 1 && (
          <a
            href={`?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(brand ? { brand } : {}),
              ...(category ? { category } : {}),
              limit: String(limit),
              page: String(page - 1),
            }).toString()}`}
            className="rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
          >
            قبلی
          </a>
        )}
        <span className="px-3 py-1">صفحه {page}</span>
        {total == null || total > page * limit ? (
          <a
            href={`?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(brand ? { brand } : {}),
              ...(category ? { category } : {}),
              limit: String(limit),
              page: String(page + 1),
            }).toString()}`}
            className="rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
          >
            بعدی
          </a>
        ) : null}
      </nav>
    </main>
  );
}
