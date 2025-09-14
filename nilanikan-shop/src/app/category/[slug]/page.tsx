// src/app/category/[slug]/page.tsx
import ProductCard from "@/components/ProductCard";
import { get, endpoints, buildQuery } from "@/lib/api";
import type { Metadata, ResolvingMetadata } from "next";

type ProductListItem = {
  id: number | string;
  slug?: string; // ممکنه API خالی بدهد → پایین فالبک گذاشتیم
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

type CategoryInfo = {
  id?: number | string;
  slug?: string;
  name?: string;
  title?: string;
  description?: string | null;
  // ↓↓↓ افزوده شد: برای نمایش آیکن و بنر دسته
  icon?: string | null;
  image?: string | null;
};

export const dynamic = "force-dynamic";

/* ----------------- Helpers ----------------- */
function listify(x: ProductsResponse): ProductListItem[] {
  return Array.isArray(x) ? x : Array.isArray((x as any).results) ? (x as any).results : [];
}
function getCount(x: ProductsResponse): number | undefined {
  return Array.isArray(x) ? x.length : (x as any).count;
}

async function fetchCategory(slug: string): Promise<CategoryInfo | null> {
  try {
    // تلاش اول با /categories/<slug>/
    const info = await get<CategoryInfo>(`${endpoints.categories}${encodeURIComponent(slug)}/`, {
      throwOnHTTP: true,
    });
    return info || null;
  } catch {
    // فالبک با ?slug=
    const res = await get<any>(`${endpoints.categories}?slug=${encodeURIComponent(slug)}&limit=1`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    const item = Array.isArray(res) ? res[0] : (Array.isArray(res?.results) ? res.results[0] : null);
    return (item as CategoryInfo) || null;
  }
}

/* ----------------- SEO ----------------- */
type PageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(
  { params, searchParams }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const page = Number(searchParams.page ?? "1") || 1;
  const cat = await fetchCategory(params.slug);

  const titleBase = cat?.title || cat?.name || params.slug;
  const title = `${titleBase}${page > 1 ? ` - صفحه ${page}` : ""} | نیلانیکان`;
  const description =
    (cat?.description && String(cat.description)) ||
    `محصولات دسته «${titleBase}» در فروشگاه نیلانیکان${page > 1 ? ` - صفحه ${page}` : ""}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

/* ----------------- Page ----------------- */
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const slug = params.slug;

  const page = Number(searchParams.page ?? "1") || 1;
  const limit = Number(searchParams.limit ?? "24") || 24;

  // 👇 اگر API تو پارامتر دیگه می‌خواست (مثلاً category_slug)، اینجا تغییر بده
  const query = buildQuery({ page, limit, category: slug });

  const [catInfo, data] = await Promise.all([
    fetchCategory(slug).catch(() => null),
    get<ProductsResponse>(`${endpoints.products}${query}`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    }),
  ]);

  const items = listify(data);
  const total = getCount(data);

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      <header className="mb-6 space-y-2">
        <div className="flex items-center gap-2">
          {/* آیکن کوچک کنار عنوان (اختیاری) */}
          {catInfo?.icon ? (
            <img
              src={catInfo.icon}
              alt={catInfo?.name || catInfo?.title || "آیکن دسته"}
              className="h-6 w-6 rounded-md object-cover"
              loading="lazy"
            />
          ) : null}
          <h1 className="text-xl md:text-2xl font-bold">
            {catInfo?.title || catInfo?.name || slug}
          </h1>
        </div>

        {catInfo?.description ? (
          <p className="text-sm text-zinc-600">{catInfo.description}</p>
        ) : null}

        {/* بنر/هدر دسته (جدید) */}
        {catInfo?.image ? (
          <div className="mt-3 overflow-hidden rounded-2xl">
            <img
              src={catInfo.image}
              alt={catInfo?.name || catInfo?.title || "بنر دسته"}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">فعلاً محصولی برای این دسته یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard
              key={p.slug ?? p.id}
              id={p.id}
              slug={p.slug ?? String(p.id)} // ✅ فالبک درست
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
            href={`?${new URLSearchParams({ limit: String(limit), page: String(page - 1) }).toString()}`}
            className="rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
          >
            قبلی
          </a>
        )}
        <span className="px-3 py-1">صفحه {page}</span>
        {total == null || total > page * limit ? (
          <a
            href={`?${new URLSearchParams({ limit: String(limit), page: String(page + 1) }).toString()}`}
            className="rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
          >
            بعدی
          </a>
        ) : null}
      </nav>
    </main>
  );
}
