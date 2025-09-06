// src/app/collection/set/page.tsx
import BundleCard from '@/components/BundleCard';

type ImgLike = string | { url?: string; image?: string; src?: string | null } | null | undefined;

type Bundle = {
  id: number | string;
  title: string;
  slug: string;
  image?: ImgLike;
  products?: Array<{ image?: ImgLike; title?: string; slug?: string }>;
};

type BundlesResponse = {
  results: Bundle[];
};

export const dynamic = 'force-dynamic'; // یا: export const revalidate = 0;

async function getBundles(): Promise<BundlesResponse> {
  const res = await fetch('/api/bundles/?limit=20', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    // لاگ ساده برای دیباگ و برگرداندن ساختار خالی
    console.error('Failed to fetch bundles:', res.status, await res.text().catch(() => ''));
    return { results: [] };
  }

  return res.json();
}

export default async function Page() {
  const data = await getBundles();

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">ست‌ها</h1>

      {data.results.length === 0 ? (
        <div className="text-sm text-gray-500">فعلاً موردی موجود نیست.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.results.map((b) => (
            <BundleCard key={b.id} bundle={b} />
          ))}
        </div>
      )}
    </main>
  );
}
