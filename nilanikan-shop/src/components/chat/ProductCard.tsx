// src/components/chat/ProductCard.tsx
"use client";

type Product = {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  stock?: number;
  sizes?: string[];
  imageUrl?: string; // اختیاری
};

export default function ProductCard({ p }: { p: Product }) {
  const href = p.slug ? `/product/${p.slug}` : "#";
  const priceText =
    typeof p.price === "number" ? `${p.price.toLocaleString()} تومان` : "—";

  return (
    <a
      href={href}
      className="block border rounded-xl hover:shadow-lg transition bg-white overflow-hidden"
    >
      <div className="grid grid-cols-[88px_1fr] gap-3">
        <div className="bg-zinc-100 w-[88px] h-[88px] overflow-hidden">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs text-zinc-500">تصویر ندارد</div>
          )}
        </div>
        <div className="py-2 pr-2">
          <div className="font-semibold text-sm text-zinc-900 line-clamp-2">{p.title}</div>
          <div className="mt-1 text-[12px] text-zinc-600">{priceText}</div>
          {Array.isArray(p.sizes) && p.sizes.length > 0 && (
            <div className="mt-1 text-[11px] text-zinc-500">سایزها: {p.sizes.join("، ")}</div>
          )}
          {typeof p.stock === "number" && (
            <div className="mt-1 text-[11px]">
              {p.stock > 0 ? <span className="text-emerald-600">موجود</span> : <span className="text-rose-600">ناموجود</span>}
            </div>
          )}
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs bg-zinc-900 text-white">مشاهده محصول</span>
          </div>
        </div>
      </div>
    </a>
  );
}
