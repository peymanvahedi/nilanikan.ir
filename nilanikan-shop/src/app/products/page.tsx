// src/app/products/page.tsx
import ProductCard from "@/components/ProductCard";
import { get, endpoints, buildQuery } from "@/lib/api";
import type { Metadata, ResolvingMetadata } from "next";

type SizeRow = {
  size: string;
  chest: number;
  waist: number;
  hip: number;
  sleeve: number;
  pantsLength: number;
};

type ProductListItem = {
  id: number | string;
  slug: string;
  name: string;
  price: number;
  discount_price?: number | null;
  image?: string | null;
  images?: Array<string | null> | null;
  gallery?: Array<{ image?: string | null }> | null;
  sizeChart?: SizeRow[];
};

type ProductsResponse =
  | { results: ProductListItem[]; count?: number; next?: string | null; previous?: string | null }
  | ProductListItem[];

export const dynamic = "force-dynamic"; // یا: export const revalidate = 0;

// ⬇️ متادیتای داینامیک (جایگزین export const metadata)
type PageProps = { searchParams: Record<string, string | string[] | undefined> };

export async function generateMetadata(
  { searchParams }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const page = Number(searchParams.page ?? "1") || 1;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const brand = typeof searchParams.brand === "string" ? searchParams.brand : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";

  const titleBits = ["محصولات"];
  if (q) titleBits.push(`جستجو: ${q}`);
  if (brand) titleBits.push(`برند: ${brand}`);
  if (category) titleBits.push(`دسته: ${category}`);
  if (page > 1) titleBits.push(`صفحه ${page}`);

  const title = `${titleBits.join(" | ")} | نیلانیکان`;
  const desc =
    q || brand || category
      ? `مرور ${q ? `نتایج «${q}»` : "محصولات"} ${brand ? `برند ${brand}` : ""} ${category ? `در دسته ${category}` : ""}${page > 1 ? ` - صفحه ${page}` : ""}.`
      : `لیست محصولات فروشگاه نیلانیکان${page > 1 ? ` - صفحه ${page}` : ""}.`;

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    twitter: { card: "summary", title, description: desc },
  };
}

function listify(x: ProductsResponse): ProductListItem[] {
  return Array.isArray(x) ? x : Array.isArray(x.results) ? x.results : [];
}
function getCount(x: ProductsResponse): number | undefined {
  return Array.isArray(x) ? x.length : x.count;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? "1") || 1;
  const limit = Number(searchParams.limit ?? "24") || 24;

  // فیلترهای اختیاری
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const brand = typeof searchParams.brand === "string" ? searchParams.brand : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  const query = buildQuery({
    page,
    limit,
    ...(category ? { category } : {}),
    ...(brand ? { brand } : {}),
    ...(q ? { search: q } : {}),
  });

  const data = await get<ProductsResponse>(`${endpoints.products}${query}`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });

  const items = listify(data);
  const total = getCount(data);

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">محصولات</h1>

        {/* نوار فیلتر ساده */}
        <form method="get" className="flex gap-2 text-sm">
          <input name="q" defaultValue={q} placeholder="جستجو…" className="h-9 rounded-lg border border-zinc-300 px-3" />
          <input name="category" defaultValue={category} placeholder="دسته‌بندی" className="h-9 rounded-lg border border-zinc-300 px-3" />
          <input name="brand" defaultValue={brand} placeholder="برند" className="h-9 rounded-lg border border-zinc-300 px-3" />
          <button className="h-9 rounded-lg bg-pink-600 px-4 font-bold text-white hover:bg-pink-700" type="submit">اعمال</button>
        </form>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">فعلاً محصولی یافت نشد.</p>
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
              sizeChart={p.sizeChart}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
        {page > 1 && (
          <a
            href={`?${new URLSearchParams({
              ...((q && { q }) || {}),
              ...((brand && { brand }) || {}),
              ...((category && { category }) || {}),
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
              ...((q && { q }) || {}),
              ...((brand && { brand }) || {}),
              ...((category && { category }) || {}),
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
