import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { fetchHome } from "@/lib/api";

export const dynamic = "force-dynamic";

/* ---------- helpers ---------- */
const listify = (x: any) =>
  !x ? [] : Array.isArray(x) ? x : Array.isArray(x?.results) ? x.results : Array.isArray(x?.items) ? x.items : [];

const pickImg = (p: any): string | undefined =>
  p?.imageUrl ||
  p?.image ||
  (Array.isArray(p?.images) && p.images.find((x: any) => !!x)) ||
  (Array.isArray(p?.gallery) && p.gallery.map((g: any) => g?.image).find((x: any) => !!x)) ||
  undefined;

const toProduct = (r: any) => {
  const title =
    r.title ||
    r.name ||
    r.product_name ||
    r.productTitle ||
    r.label ||
    r.caption ||
    r._raw?.title ||
    r._raw?.name ||
    "بدون نام";

  const imageUrl =
    pickImg(r) ||
    r.thumbnail ||
    r.main_image ||
    r.cover ||
    r.photo?.url ||
    r.images?.[0]?.url ||
    r.media?.main?.url ||
    "";

  const slug = r.slug || r.handle || r.seoSlug || r._raw?.slug;
  const href = r.href || r.link || r.target || (slug ? `/product/${slug}` : undefined);

  return { ...r, title, name: title, imageUrl, href };
};

/* ---------- page ---------- */
export default async function Page() {
  const home = await fetchHome();
  const items = listify(home?.bestSellers).map(toProduct);

  return (
    <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">پرفروش‌ترین‌ها</h1>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg bg-pink-600 px-3 text-white text-sm font-bold hover:bg-pink-700"
        >
          بازگشت
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((it: any, i: number) => (
          <ProductCard
            key={it.id ?? it.slug ?? i}
            item={{ ...it, ribbon: it.ribbon ?? "پرفروش", ribbonTone: it.ribbonTone ?? "pink" }}
            hrefBase="/product"
          />
        ))}
      </div>
    </main>
  );
}
