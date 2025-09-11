// src/components/BundleCard.tsx
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import { absolutizeImage } from "@/lib/media";

type ImgLike =
  | string
  | { url?: string; image?: string; src?: string | null }
  | null
  | undefined;

export type Bundle = {
  id?: number | string;
  title: string;
  slug: string;
  image?: ImgLike;
  products?: Array<
    | {
        image?: ImgLike;
        title?: string;
        slug?: string;
        // ↓ قیمت‌های رایج محصولات داخلی
        price?: number | string | null;
        sale_price?: number | string | null;
        discounted_price?: number | string | null;
        regular_price?: number | string | null;
        min_price?: number | string | null;
        max_price?: number | string | null;
        quantity?: number | string | null;
      }
    | Record<string, any>
  >;

  // فیلدهای احتمالی قیمت/تخفیف/لیبل در خود باندل
  label?: string | null;
  price?: number | string | null;
  price_before?: number | string | null;
  price_min?: number | string | null;
  price_max?: number | string | null;
  discount_percent?: number | string | null;
  sale_price?: number | string | null;
  regular_price?: number | string | null;
  bundle_price?: number | string | null;
  discounted_price?: number | string | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  total_price?: number | string | null;
  final_price?: number | string | null;
};

function toFa(n: number) {
  try {
    return n.toLocaleString("fa-IR");
  } catch {
    return String(n);
  }
}
function num(x: any): number | null {
  if (x == null) return null;
  const v = typeof x === "string" ? x.replace(/[^\d.]/g, "") : x;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// جمع قیمت محصولات داخلی باندل (اگر قیمت مستقیم نداشت)
function sumProducts(products?: Bundle["products"]): { total?: number; regular?: number } {
  if (!Array.isArray(products) || products.length === 0) return {};
  let total = 0;
  let regular = 0;
  let saw = false;

  for (const it of products) {
    const any = it as any;
    const q = num(any?.quantity) ?? 1;

    // قیمت نهایی هر آیتم
    const pItem =
      num(any?.price) ??
      num(any?.sale_price) ??
      num(any?.discounted_price) ??
      num(any?.min_price) ??
      null;

    // قیمت قبل از تخفیف هر آیتم
    const bpItem =
      num(any?.price_before) ??
      num(any?.regular_price) ??
      num(any?.max_price) ??
      null;

    if (pItem) {
      total += pItem * q;
      saw = true;
    }
    if (bpItem) {
      regular += bpItem * q;
    } else if (pItem) {
      // اگر قیمت قبل نبود، حداقل برابر نهایی در نظر بگیریم تا off خراب نشه
      regular += pItem * q;
    }
  }
  return saw ? { total, regular } : {};
}

export default function BundleCard({ bundle }: { bundle: Bundle }) {
  const cover =
    absolutizeImage(bundle.image) ||
    absolutizeImage(bundle.products?.[0]?.image) ||
    "/placeholder-bundle.png";

  // قیمت نهایی (اولویت با فیلدهای مستقیم)
  let p =
    num(bundle.price) ??
    num(bundle.bundle_price) ??
    num(bundle.final_price) ??
    num(bundle.sale_price) ??
    num(bundle.discounted_price) ??
    num(bundle.total_price) ??
    num(bundle.price_min) ??
    num(bundle.min_price) ??
    null;

  // قیمت قبل
  let bp =
    num(bundle.price_before) ??
    num(bundle.regular_price) ??
    num(bundle.price_max) ??
    num(bundle.max_price) ??
    null;

  // اگر هیچ‌کدام نبود، از محصولات داخلی جمع بزن
  if (p == null) {
    const sum = sumProducts(bundle.products);
    if (sum.total != null) p = sum.total;
    if (bp == null && sum.regular != null) bp = sum.regular;
  }

  // درصد تخفیف
  const calcOff = p && bp && p < bp ? Math.round((1 - p / bp) * 100) : null;
  const off = num(bundle.discount_percent) ?? calcOff;

  // روبان
  const ribbonText =
    (typeof bundle.label === "string" && bundle.label.trim()) ||
    (off != null ? `%${off} تخفیف` : null);

  return (
    <Link
      href={`/bundle/${bundle.slug}`}
      className="group block rounded-2xl border border-zinc-200 bg-white p-3 hover:shadow-sm transition"
      aria-label={bundle.title}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl ring-1 ring-zinc-100">
        {ribbonText && (
          <span className="absolute right-0 top-2 z-10 rounded-l-xl px-2 py-1 text-[11px] font-extrabold bg-pink-50 text-pink-700 ring-1 ring-pink-100">
            {ribbonText}
          </span>
        )}
        <ImageWithFallback
          src={cover}
          alt={bundle.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={false}
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="mt-2 text-sm md:text-base font-medium line-clamp-2">
        {bundle.title}
      </div>

      {(p != null || bp != null) && (
        <div className="mt-1 flex items-baseline justify-between">
          {bp != null && p != null && p < bp ? (
            <del className="text-xs text-zinc-400">{toFa(bp)}</del>
          ) : (
            <span className="text-xs text-transparent select-none">-</span>
          )}
          <div className="text-pink-600 font-extrabold">
            {toFa(Number(p ?? bp ?? 0))}
            <span className="text-[11px] mr-1">تومان</span>
          </div>
        </div>
      )}
    </Link>
  );
}
