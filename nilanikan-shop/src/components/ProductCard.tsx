// src/components/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { absolutizeMedia } from "@/lib/api";

/** مقادیر متنی که ممکن است false هم باشند (برای عبارت‌های شرطی) */
type MaybeStr = string | null | undefined | false;

type BaseMedia =
  | MaybeStr
  | { image?: MaybeStr; [k: string]: any };

/** آیتم عمومی */
export type ProductLike = {
  id?: number | string;
  slug?: string;
  name?: string;
  brand?: string | null;
  price?: number | string;
  discount_price?: number | string | null;
  imageUrl?: MaybeStr;
  image?: MaybeStr;
  images?: MaybeStr[] | null;
  gallery?: BaseMedia[] | null;
  href?: string;

  // برای نمایش پیشرفته (اختیاری)
  ribbon?: string;                 // متن روبان گوشه (مثل "پرفروش")
  ribbonTone?: "pink" | "emerald" | "zinc";
  tag?: string;                    // برچسب کوچک بالای تصویر (مثل "آگهی" یا "جدید")
};

/** پراپ‌های تخت */
export type ProductCardFlatProps = {
  id?: number | string;
  slug?: string;
  href?: string;
  name?: string;
  brand?: string | null;
  price?: number | string;
  discount_price?: number | string | null;
  imageUrl?: MaybeStr;
  image?: MaybeStr;
  images?: MaybeStr[] | null;
  gallery?: BaseMedia[] | null;
  className?: string;

  // نمایش پیشرفته
  ribbon?: string;
  ribbonTone?: "pink" | "emerald" | "zinc";
  tag?: string;
};

/** حالت آیتم + پیشوند لینک */
export type ProductCardItemProps = {
  item: ProductLike;
  hrefBase?: string | false;
  className?: string;
};

export type ProductCardProps = ProductCardFlatProps | ProductCardItemProps;

/* -------------------- Utils -------------------- */
function normalizeStr(x: MaybeStr): string | undefined {
  return typeof x === "string" && x.trim() ? x : undefined;
}

function resolveImage(
  imageUrl?: MaybeStr,
  image?: MaybeStr,
  images?: (MaybeStr)[] | null,
  gallery?: (BaseMedia)[] | null,
  seed?: string
) {
  const firstGallery = Array.isArray(gallery) && gallery[0] && (gallery[0] as any).image;

  const candidate =
    normalizeStr(imageUrl) ??
    normalizeStr(Array.isArray(images) ? images[0] : undefined) ??
    normalizeStr(firstGallery as MaybeStr) ??
    normalizeStr(image);

  const absolute = absolutizeMedia(candidate);
  if (absolute) return absolute;
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "card")}/600/750`;
}

function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}

function ribbonToneClasses(tone?: "pink" | "emerald" | "zinc") {
  switch (tone) {
    case "emerald":
      return "bg-emerald-600 text-white";
    case "zinc":
      return "bg-zinc-700 text-white";
    case "pink":
    default:
      return "bg-pink-600 text-white";
  }
}

/* -------------------- Component -------------------- */
export default function ProductCard(props: ProductCardProps) {
  // نرمال‌سازی پراپ‌ها برای هر دو حالت
  const flat: ProductCardFlatProps =
    "item" in props
      ? {
          id: props.item.id,
          slug: props.item.slug,
          href:
            props.item.href ??
            (props.hrefBase
              ? `${props.hrefBase}${props.hrefBase.endsWith("/") ? "" : "/"}${
                  props.item.slug ?? props.item.id ?? ""
                }`
              : undefined),
          name: props.item.name,
          brand: props.item.brand ?? null,
          price: props.item.price,
          discount_price: props.item.discount_price ?? null,
          imageUrl: props.item.imageUrl,
          image: props.item.image ?? null,
          images: props.item.images ?? null,
          gallery: props.item.gallery ?? null,
          className: props.className ?? "",
          ribbon: props.item.ribbon,
          ribbonTone: props.item.ribbonTone,
          tag: props.item.tag,
        }
      : props;

  const {
    id,
    slug,
    href,
    name = "بدون نام",
    brand = null,
    price,
    discount_price = null,
    imageUrl,
    image = null,
    images = null,
    gallery = null,
    className = "",
    ribbon,
    ribbonTone,
    tag,
  } = flat;

  const fallbackHref =
    href ?? (slug ? `/product/${slug}` : id != null ? `/product/${id}` : "#");

  const p = price != null && price !== "" ? Number(price) : undefined;
  const dp =
    discount_price != null && discount_price !== ""
      ? Number(discount_price)
      : undefined;

  const hasOff = p != null && dp != null && dp < p;
  const off = hasOff ? Math.round((1 - (dp as number) / (p as number)) * 100) : 0;

  const src = resolveImage(
    imageUrl,
    image,
    images ?? undefined,
    gallery ?? undefined,
    String(slug ?? id ?? name)
  );

  return (
    <Link
      href={fallbackHref}
      className={`relative block rounded-2xl border border-zinc-200 bg-white p-3 hover:shadow-sm transition ${className}`}
      aria-label={name}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl ring-1 ring-zinc-100">
        {/* برچسب کوچک بالا-چپ (مثلا «آگهی») */}
        {tag && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-pink-600 ring-1 ring-pink-100">
            {tag}
          </span>
        )}

        {/* روبان بالا-راست (مثلا «پرفروش») */}
        {ribbon && (
          <span
            className={`absolute right-0 top-2 z-10 rounded-l-xl px-2 py-1 text-[11px] font-extrabold ${ribbonToneClasses(
              ribbonTone
            )}`}
          >
            {ribbon}
          </span>
        )}

        <Image
          src={src || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover"
          sizes="(min-width:1024px) 240px, 70vw"
        />
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">{name}</h3>
        {brand && <div className="text-[11px] text-zinc-500">{brand}</div>}

        {(p != null || dp != null) && (
          <>
            <div className="flex items-end gap-2">
              {hasOff && (
                <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                  {toFa(off)}٪
                </span>
              )}
              {hasOff && p != null && (
                <del className="text-xs text-zinc-400">{toFa(p)}</del>
              )}
            </div>
            <div className="text-pink-600 font-extrabود">
              {toFa(Number(dp ?? p ?? 0))}
              <span className="text-[11px] mr-1">تومان</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
