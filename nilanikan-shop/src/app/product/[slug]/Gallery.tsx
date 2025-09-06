// src/app/product/[slug]/Gallery.tsx
import ImageWithFallback from '@/components/ImageWithFallback';
import { resolveGallery } from '@/lib/media';

type ImgLike = string | { url?: string; image?: string; src?: string | null } | null | undefined;

export type ProductForGallery = {
  title?: string;
  image?: ImgLike;
  images?: ImgLike[];
  gallery?: Array<{ image?: ImgLike }>;
};

export default function Gallery({ product }: { product: ProductForGallery }) {
  const gallery = resolveGallery([
    ...(product?.images || []),
    ...((product?.gallery || []).map(g => g?.image) || []),
    product?.image || null,
  ]);

  return (
    <section aria-label="Product gallery" className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {gallery.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
            <ImageWithFallback
              src={src}
              alt={product?.title || `product-image-${i + 1}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
