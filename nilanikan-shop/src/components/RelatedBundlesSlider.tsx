// src/components/RelatedBundlesSlider.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export type RelatedBundle = {
  id: number | string;
  slug: string;
  title?: string | null;
  name?: string | null;
  image?: string | null;
  images?: string[];
  gallery?: { id?: number | string; image?: string; alt?: string | null }[];
  price?: number | string | null;
  bundle_price?: number | string | null;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number | null;
};

const toFa = (n: number) => n.toLocaleString("fa-IR");

function pickCover(b: RelatedBundle) {
  return (
    (Array.isArray(b.images) && b.images[0]) ||
    (Array.isArray(b.gallery) && b.gallery[0]?.image) ||
    b.image ||
    "/placeholder.svg"
  );
}

export default function RelatedBundlesSlider({ items }: { items: RelatedBundle[] }) {
  if (!items?.length) return null;

  return (
    <div className="relative">
      <div className="mt-4 flex overflow-x-auto gap-3 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden">
        {items.map((b) => {
          const cover = pickCover(b);
          const title = b.title || b.name || "باندل";
          const rawPrice = Number(b.bundle_price ?? b.price ?? 0);
          const hasPrice = Number.isFinite(rawPrice) && rawPrice > 0;

          return (
            <Link
              key={b.slug ?? b.id}
              href={`/bundle/${b.slug ?? b.id}`}
              className="min-w-[200px] w-1/2 sm:w-1/3 lg:w-1/4 snap-start block group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20 rounded-2xl"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-zinc-200">
                <Image
                  src={cover}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-2">
                <div className="text-sm md:text-base font-medium line-clamp-1 text-zinc-900">
                  {title}
                </div>
                {hasPrice && (
                  <div className="mt-1 text-[13px] md:text-sm font-bold text-pink-600">
                    {toFa(rawPrice)}
                    <span className="text-[10px] mr-1">تومان</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
