// src/app/vip/page.tsx
import ProductCard from "@/components/ProductCard";
import { get, endpoints, absolutizeMedia } from "@/lib/api";

type ProductLike = {
  id: number | string;
  slug?: string;
  name?: string;
  title?: string;
  price?: number | string;
  discount_price?: number | string | null;
  image?: string | null;
  images?: Array<string | null> | null;
  gallery?: Array<{ image?: string | null }> | null;
};

type ApiList<T> = { results?: T[] } | T[] | null | undefined;

export const dynamic = "force-dynamic"; // همیشه تازه

const TAGS = ["vip", "VIP", "وی‌آی‌پی", "پکیج-وی-آی-پی", "package_vip"];

// کمک‌کننده‌ها
const toNum = (v: any): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = Number(String(v).replace(/[,٬\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const listify = <T,>(x: ApiList<T>): T[] =>
  Array.isArray(x) ? x : Array.isArray((x as any)?.results) ? (x as any).results : [];

function normalizeAsProduct(x: any) {
  // ورودی می‌تواند Product یا Bundle باشد
  const name = String(x?.name ?? x?.title ?? "بدون عنوان");
  const price =
    toNum(x?.bundle_price) || toNum(x?.final_price) || toNum(x?.price) || 0;

  const imageCandidate =
    x?.image ?? x?.imageUrl ?? x?.thumbnail ?? x?.cover ?? null;

  return {
    id: String(x?.id ?? x?.pk ?? ""),
    slug: typeof x?.slug === "string" ? x.slug : undefined,
    name,
    price,
    discount_price: toNum(x?.discount_price) || null,
    image: absolutizeMedia(imageCandidate || undefined),
    images: Array.isArray(x?.images) ? x.images : undefined,
    gallery: Array.isArray(x?.gallery) ? x.gallery : undefined,
  };
}

async function fetchVipProducts() {
  // اول تلاش برای باندل‌های VIP
  for (const t of TAGS) {
    const bundles = await get<any>(`${endpoints.bundles}?tag=${encodeURIComponent(t)}&limit=40`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    const items = listify(bundles).map(normalizeAsProduct);
    if (items.length) return items;
  }

  // اگر باندلی نبود، از محصولات VIP بگیر
  for (const t of TAGS) {
    const prods = await get<any>(`${endpoints.products}?tag=${encodeURIComponent(t)}&limit=40`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });
    const items = listify(prods).map(normalizeAsProduct);
    if (items.length) return items;
  }

  // در نهایت، محصولات active یا برچسب خاص دیگر (fallback ساده)
  const activeBundles = await get<any>(`${endpoints.bundles}?active=true&limit=40`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });
  const items = listify(activeBundles).map(normalizeAsProduct);
  return items;
}

export default async function VipPage() {
  const items = await fetchVipProducts();

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">ویژه‌ های VIP</h1>
        <p className="mt-1 text-sm text-zinc-600">
          مجموعه‌ای از محصولات و ست‌های ویژه با تخفیف‌ و مزایای خاص.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">فعلاً آیتمی برای VIP یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard
              key={p.slug ?? p.id}
              id={p.id}
              slug={p.slug ?? String(p.id)}
              name={p.name}
              price={typeof p.price === "number" ? p.price : toNum(p.price)}
              discount_price={typeof p.discount_price === "number" ? p.discount_price : undefined}
              image={p.image ?? undefined}
              images={p.images ?? undefined}
              gallery={p.gallery ?? undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
