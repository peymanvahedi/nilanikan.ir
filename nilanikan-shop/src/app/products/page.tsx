// src/app/products/page.tsx
import ProductCard from "@/components/ProductCard";
import { get, endpoints, buildQuery } from "@/lib/api";
import type { Metadata, ResolvingMetadata } from "next";

/* ============== Types ============== */
type ProductListItem = {
  id: number | string;
  slug?: string;
  name?: string;
  brand?: string | null;
  price?: number | string;
  discount_price?: number | string | null;
  image?: string | null;
  images?: Array<string | null> | null;
  gallery?: Array<{ image?: string | null }> | null;
  imageUrl?: string | null;
};

type BundleListItem = {
  id: number | string;
  slug?: string;
  name?: string;
  title?: string;
  price?: number | string;
  discount_price?: number | string | null;
  final_price?: number | string | null;
  bundle_price?: number | string | null;
  total_price?: number | string | null;
  sum_price?: number | string | null;
  offer_price?: number | string | null;
  sale_price?: number | string | null;
  image?: string | null;
  images?: Array<string | null> | null;
  gallery?: Array<{ image?: string | null }> | null;
  imageUrl?: string | null;
};

type APIResponse<T> =
  | { results: T[]; count?: number; next?: string | null; previous?: string | null }
  | T[];

type Search = {
  page?: string;
  limit?: string;
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  price_min?: string;
  price_max?: string;
  set?: string;
  is_set?: string;
  recommended?: string;             // ← پشتیبانی از محصولات/ست‌های پیشنهادی
};

type PageProps = { searchParams: Promise<Search> };

export const dynamic = "force-dynamic";

/* ============== Helpers ============== */
function listify<T>(x: APIResponse<T>): T[] {
  return Array.isArray(x) ? x : Array.isArray((x as any).results) ? (x as any).results : [];
}
function getCount<T>(x: APIResponse<T>): number | undefined {
  return Array.isArray(x) ? x.length : (x as any).count;
}
function truthySet(v?: string) {
  const x = (v ?? "").toLowerCase();
  return x === "1" || x === "true" || x === "on";
}
function numify(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return isFinite(n) ? n : undefined;
  }
  return undefined;
}
function bundlePrices(b: Partial<BundleListItem>) {
  const origKeys = ["total_price", "sum_price", "original_price", "list_price", "compare_at_price", "price"] as const;
  const discKeys = ["discount_price", "final_price", "bundle_price", "offer_price", "sale_price", "payable_price"] as const;

  let orig: number | undefined;
  let disc: number | undefined;

  for (const k of origKeys) {
    if (orig === undefined) orig = numify((b as any)[k]);
  }
  for (const k of discKeys) {
    if (disc === undefined) disc = numify((b as any)[k]);
  }

  // اگر تخفیف از قیمت اولیه کمتر نبود، تخفیف را نادیده بگیر
  if (orig !== undefined && disc !== undefined && disc >= orig) disc = undefined;

  // اگر فقط تخفیف داریم، همان را به‌عنوان قیمت نشان بده
  if (orig === undefined && disc !== undefined) {
    orig = disc;
    disc = undefined;
  }
  return { orig, disc };
}

/* ============== SEO ============== */
export async function generateMetadata(
  { searchParams }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  const q = (sp.q ?? "").trim();
  const category = sp.category ?? "";
  const minP = sp.min_price ?? sp.price_min ?? "";
  const maxP = sp.max_price ?? sp.price_max ?? "";
  const onlySets = truthySet(sp.set ?? sp.is_set);
  const isRecommended = truthySet(sp.recommended);

  const titleBits = [
    isRecommended ? (onlySets ? "ست‌های پیشنهادی" : "محصولات پیشنهادی") : (onlySets ? "ست‌ها" : "محصولات"),
  ];
  if (q) titleBits.push(`جستجو: ${q}`);
  if (category) titleBits.push(`دسته: ${category}`);
  if (minP || maxP) titleBits.push(`قیمت: ${minP || "۰"} تا ${maxP || "∞"}`);
  if (page > 1) titleBits.push(`صفحه ${page}`);

  const title = `${titleBits.join(" | ")} | نیلانیکان`;
  const description = titleBits.join("، ");

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

/* ============== Page ============== */
export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page = Number(sp.page ?? "1") || 1;
  const limit = Number(sp.limit ?? "24") || 24;

  const q = (sp.q ?? "").trim() || undefined;
  const category = sp.category || undefined;

  const minPrice = sp.min_price ?? sp.price_min;
  const maxPrice = sp.max_price ?? sp.price_max;
  const hasMin = typeof minPrice === "string" && minPrice !== "";
  const hasMax = typeof maxPrice === "string" && maxPrice !== "";

  const onlySets = truthySet(sp.set ?? sp.is_set);
  const isRecommended = truthySet(sp.recommended);   // ← خواندن پارامتر

  const queryCommon = {
    page,
    limit,
    ...(q ? { search: q } : {}),
    ...(category ? { category } : {}),
    ...(hasMin ? { min_price: minPrice, price_min: minPrice } : {}),
    ...(hasMax ? { max_price: maxPrice, price_max: maxPrice } : {}),
    ...(isRecommended ? { recommended: "1" } : {}),  // ← پاس‌دادن به API
  };

  if (onlySets) {
    // ------ Bundles (ست‌ها) ------
    const query = buildQuery(queryCommon);
    const data = await get<APIResponse<BundleListItem>>(`${endpoints.bundles}${query}`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    const items = listify(data);
    const total = getCount(data);

    return (
      <main className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
        <header className="mb-6">
          <h1 className="mb-3 text-xl md:text-2xl font-bold">
            {isRecommended ? "ست‌های پیشنهادی" : "ست‌ها"}
          </h1>

          <form method="get" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            <input name="q" defaultValue={q ?? ""} placeholder="جستجو…" className="h-10 rounded-lg border border-zinc-300 px-3" />
            <input name="category" defaultValue={category ?? ""} placeholder="دسته‌بندی" className="h-10 rounded-lg border border-zinc-300 px-3" />
            <div className="flex items-center gap-2">
              <input type="number" inputMode="numeric" name="min_price" defaultValue={hasMin ? String(minPrice) : ""} placeholder="قیمت از…" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
              <span className="text-zinc-400">تا</span>
              <input type="number" inputMode="numeric" name="max_price" defaultValue={hasMax ? String(maxPrice) : ""} placeholder="…تا قیمت" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
            </div>
            <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3">
              <input type="checkbox" name="set" value="1" defaultChecked className="size-4 accent-pink-600" />
              <span>ست</span>
            </label>

            {/* حفظ recommended در فرم */}
            {isRecommended && <input type="hidden" name="recommended" value="1" />}

            <button type="submit" className="h-10 rounded-lg bg-pink-600 px-4 font-bold text-white hover:bg-pink-700">
              اعمال
            </button>
          </form>
        </header>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">فعلاً ستی یافت نشد.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((b) => {
              const slug = b.slug ?? (b.id != null ? String(b.id) : "");
              const { orig, disc } = bundlePrices(b);
              return (
                <ProductCard
                  key={slug || String(b.id)}
                  id={b.id}
                  slug={slug}
                  href={`/bundle/${slug}`}
                  name={b.name ?? b.title ?? "بدون نام"}
                  price={orig}
                  discount_price={disc}
                  image={b.image ?? undefined}
                  images={b.images ?? undefined}
                  gallery={b.gallery ?? undefined}
                />
              );
            })}
          </div>
        )}

        {/* صفحه‌بندی - recommended را نگه داریم */}
        <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <a
              href={`?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(category ? { category } : {}),
                ...(hasMin ? { min_price: String(minPrice) } : {}),
                ...(hasMax ? { max_price: String(maxPrice) } : {}),
                ...(isRecommended ? { recommended: "1" } : {}),
                set: "1",
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
                ...(category ? { category } : {}),
                ...(hasMin ? { min_price: String(minPrice) } : {}),
                ...(hasMax ? { max_price: String(maxPrice) } : {}),
                ...(isRecommended ? { recommended: "1" } : {}),
                set: "1",
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

  // ------ Products (default) ------
  const query = buildQuery(queryCommon);
  const data = await get<APIResponse<ProductListItem>>(`${endpoints.products}${query}`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });

  const items = listify(data);
  const total = getCount(data);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
      <header className="mb-6">
        <h1 className="mb-3 text-xl md:text-2xl font-bold">
          {isRecommended ? "محصولات پیشنهادی" : "محصولات"}
        </h1>

        <form method="get" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
          <input name="q" defaultValue={q ?? ""} placeholder="جستجو…" className="h-10 rounded-lg border border-zinc-300 px-3" />
          <input name="category" defaultValue={category ?? ""} placeholder="دسته‌بندی" className="h-10 rounded-lg border border-zinc-300 px-3" />
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" name="min_price" defaultValue={hasMin ? String(minPrice) : ""} placeholder="قیمت از…" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
            <span className="text-zinc-400">تا</span>
            <input type="number" inputMode="numeric" name="max_price" defaultValue={hasMax ? String(maxPrice) : ""} placeholder="…تا قیمت" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
          </div>

          {/* حفظ recommended در فرم */}
          {isRecommended && <input type="hidden" name="recommended" value="1" />}

          <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3">
            <input type="checkbox" name="set" value="1" className="size-4 accent-pink-600" />
            <span>ست</span>
          </label>
          <button type="submit" className="h-10 rounded-lg bg-pink-600 px-4 font-bold text-white hover:bg-pink-700">
            اعمال
          </button>
        </form>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">فعلاً محصولی یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard
              key={p.slug ?? p.id}
              id={p.id}
              slug={p.slug ?? String(p.id)}
              name={p.name ?? "بدون نام"}
              price={
                typeof p.price === "number" || typeof p.price === "string"
                  ? Number(p.price)
                  : undefined
              }
              discount_price={
                typeof p.discount_price === "number" || typeof p.discount_price === "string"
                  ? Number(p.discount_price)
                  : undefined
              }
              image={p.image ?? undefined}
              images={p.images ?? undefined}
              gallery={p.gallery ?? undefined}
            />
          ))}
        </div>
      )}

      {/* صفحه‌بندی - recommended را نگه داریم */}
      <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
        {page > 1 && (
          <a
            href={`?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(category ? { category } : {}),
              ...(hasMin ? { min_price: String(minPrice) } : {}),
              ...(hasMax ? { max_price: String(maxPrice) } : {}),
              ...(isRecommended ? { recommended: "1" } : {}),
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
              ...(category ? { category } : {}),
              ...(hasMin ? { min_price: String(minPrice) } : {}),
              ...(hasMax ? { max_price: String(maxPrice) } : {}),
              ...(isRecommended ? { recommended: "1" } : {}),
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
