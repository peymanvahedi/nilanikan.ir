// src/app/bundles/page.tsx
import BundleCard from "@/components/BundleCard";
import { get, endpoints, buildQuery } from "@/lib/api";
import type { Metadata, ResolvingMetadata } from "next";

type ImgLike = string | { url?: string; image?: string; src?: string | null } | null | undefined;

type Bundle = {
  id: number | string;
  title: string;
  slug: string;
  image?: ImgLike;
  products?: Array<{ image?: ImgLike; title?: string; slug?: string }>;
};

type BundlesResponse =
  | { results?: Bundle[]; count?: number; next?: string | null; previous?: string | null }
  | Bundle[];

export const dynamic = "force-dynamic";

// ⬇️ متادیتای داینامیک (جایگزین export const metadata)
type PageProps = { searchParams: Record<string, string | string[] | undefined> };

export async function generateMetadata(
  { searchParams }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const page = Number(searchParams.page ?? "1") || 1;
  const title = `باندل‌ها${page > 1 ? ` - صفحه ${page}` : ""} | نیلانیکان`;
  const description = `لیست ست‌ها و باندل‌های فروشگاه نیلانیکان${page > 1 ? ` - صفحه ${page}` : ""}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

function listify(x: BundlesResponse): Bundle[] {
  return Array.isArray(x) ? x : Array.isArray(x.results) ? x.results : [];
}
function getCount(x: BundlesResponse): number | undefined {
  return Array.isArray(x) ? x.length : x.count;
}

export default async function BundlesPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? "1") || 1;
  const limit = Number(searchParams.limit ?? "24") || 24;

  const query = buildQuery({ page, limit });

  const data = await get<BundlesResponse>(`${endpoints.bundles}${query}`, {
    throwOnHTTP: false,
    fallback: { results: [] },
  });

  const items = listify(data);
  const total = getCount(data);

  return (
    <main className="container mx-auto px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-extrabold mb-4">باندل‌ها</h1>
      <p className="text-sm text-slate-600 mb-6">
        این صفحه همه‌ی ست‌ها و باندل‌های فروشگاه را نمایش می‌دهد.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">هیچ باندلی یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((b) => (
            <BundleCard key={b.id} bundle={b} />
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
