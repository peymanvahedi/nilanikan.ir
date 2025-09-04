"use client";

type Item = {
  id: string | number;
  slug: string;
  title: string;
  type?: string;      // مثلا "ست" یا "تک"
  price: number;
  image?: string | null;
};

export function ProductsGrid({
  items,
  loading,
  total,
  page,
  perPage,
  onPageChange,
  sort,
  onSortChange,
}: {
  items: Item[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  sort: "latest" | "price-asc" | "price-desc" | "popular" | string;
  onSortChange: (s: "latest" | "price-asc" | "price-desc" | "popular" | string) => void;
}) {
  const pages = Math.max(1, Math.ceil((total || 0) / (perPage || 1)));
  const empty = !loading && (items?.length ?? 0) === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-80">
          {loading ? "در حال بارگذاری…" : `${total} کالا`}
        </p>
        <select
          value={sort}
          onChange={(e) =>
            onSortChange(e.target.value as "latest" | "price-asc" | "price-desc" | "popular")
          }
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="latest">جدیدترین</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="popular">محبوب‌ترین</option>
        </select>
      </div>

      {empty && (
        <div className="border rounded-2xl p-10 text-center">چیزی پیدا نشد.</div>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {items?.map((p) => (
          <li key={p.id} className="rounded-2xl border overflow-hidden">
            <a href={`/product/${p.slug}`} className="block">
              <div className="aspect-[3/4] bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image || "/placeholder.png"}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="text-sm line-clamp-2 min-h-[2.5rem]">
                  {p.title}
                </div>
                {p.type && (
                  <div className="mt-1 text-xs opacity-70">{p.type}</div>
                )}
                <div className="mt-2 font-semibold">
                  {Intl.NumberFormat("fa-IR").format(p.price)} تومان
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => {
            const n = i + 1;
            const active = n === page;
            return (
              <button
                key={n}
                onClick={() => onPageChange(n)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  active ? "border-black" : "border-gray-300"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsGrid;
