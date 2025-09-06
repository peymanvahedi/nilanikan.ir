"use client";

import Link from "next/link";
import Image from "next/image";
import { absolutizeMedia } from "@/lib/api";

const priceFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

type SizeRow = {
  size: string;
  chest: number;
  waist: number;
  hip: number;
  sleeve: number;
  pantsLength: number;
};

type ProductCardProps = {
  id: number | string;
  slug: string;
  name: string;
  price: number;
  discount_price?: number | null; // در صورت وجود، قیمت با تخفیف نمایش داده می‌شود
  image?: string | null;          // می‌تواند نسبی باشد؛ absolutizeMedia آن را درست می‌کند
  images?: Array<string | null> | null;
  gallery?: Array<{ image?: string | null }> | null;
  sizeChart?: SizeRow[];          // جدول سایزبندی (اختیاری)
};

function resolveCover(p: ProductCardProps): string {
  const candidate =
    (Array.isArray(p.images) && p.images[0]) ||
    (Array.isArray(p.gallery) && p.gallery[0]?.image) ||
    p.image ||
    null;

  const abs = absolutizeMedia(candidate || undefined);
  return abs || "/placeholder.svg";
}

export default function ProductCard(props: ProductCardProps) {
  const { slug, name, price, discount_price, sizeChart } = props;
  const href = `/product/${slug}`;
  const cover = resolveCover(props);

  const hasOff = typeof discount_price === "number" && discount_price > 0 && discount_price < price;
  const off = hasOff ? Math.round((1 - (discount_price as number) / price) * 100) : 0;

  return (
    <Link
      href={href}
      className="border rounded-2xl shadow hover:shadow-lg transition overflow-hidden bg-white block
                 w-full max-w-[360px] sm:max-w-[280px]"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-white">
        <Image
          src={cover}
          alt={name}
          fill
          className="object-cover sm:max-h-[220px]"
          sizes="(min-width:1024px) 280px, (min-width:640px) 240px, 90vw"
          priority={false}
        />
      </div>

      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm sm:text-xs font-bold text-zinc-800 line-clamp-2">{name}</h3>

        <div className="flex items-end gap-2">
          {hasOff && (
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              {priceFormatter.format(off)}٪
            </span>
          )}
          {hasOff && (
            <del className="text-xs text-zinc-400">{priceFormatter.format(price)}</del>
          )}
        </div>

        <span className="text-pink-600 font-extrabold text-base sm:text-sm">
          {priceFormatter.format(hasOff ? (discount_price as number) : price)} تومان
        </span>

        {/* نمایش جدول سایزبندی (اختیاری) */}
        {sizeChart && sizeChart.length > 0 && (
          <div className="mt-2 text-xs text-zinc-600">
            <h4 className="font-semibold">جدول سایزبندی</h4>
            <div className="overflow-auto -mx-1">
              <table className="w-full mt-1 border-collapse min-w-[420px]">
                <thead>
                  <tr>
                    <th className="border-b py-1 px-2 text-right">سایز</th>
                    <th className="border-b py-1 px-2 text-right">دور سینه</th>
                    <th className="border-b py-1 px-2 text-right">دور کمر</th>
                    <th className="border-b py-1 px-2 text-right">دور باسن</th>
                    <th className="border-b py-1 px-2 text-right">قد آستین</th>
                    <th className="border-b py-1 px-2 text-right">قد شلوار</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((s) => (
                    <tr key={s.size}>
                      <td className="border-b py-1 px-2">{s.size}</td>
                      <td className="border-b py-1 px-2">{s.chest}</td>
                      <td className="border-b py-1 px-2">{s.waist}</td>
                      <td className="border-b py-1 px-2">{s.hip}</td>
                      <td className="border-b py-1 px-2">{s.sleeve}</td>
                      <td className="border-b py-1 px-2">{s.pantsLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
