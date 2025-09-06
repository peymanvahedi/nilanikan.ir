// src/components/BundleCard.tsx
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';
import { absolutizeImage } from '@/lib/media';

type ImgLike = string | { url?: string; image?: string; src?: string | null } | null | undefined;

export type Bundle = {
  id?: number | string;
  title: string;
  slug: string;
  image?: ImgLike;
  products?: Array<{ image?: ImgLike; title?: string; slug?: string }>;
};

export default function BundleCard({ bundle }: { bundle: Bundle }) {
  const cover =
    absolutizeImage(
      bundle.image ||
        (bundle.products?.find((p) => !!p?.image)?.image) ||
        null
    );

  return (
    <Link
      href={`/bundle/${bundle.slug}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20 rounded-2xl"
    >
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
        <ImageWithFallback
          src={cover}
          alt={bundle.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={false}
        />
      </div>
      <div className="mt-2 text-sm md:text-base font-medium line-clamp-2">
        {bundle.title}
      </div>
    </Link>
  );
}
