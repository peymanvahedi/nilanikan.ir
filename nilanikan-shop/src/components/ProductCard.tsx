"use client";

import Link from "next/link";

const priceFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

type ProductCardProps = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
};

export default function ProductCard({ id, slug, name, price, image }: ProductCardProps) {
  return (
    <Link
      href={`/product/${slug}`}
      className="border rounded-2xl shadow hover:shadow-lg transition overflow-hidden bg-white block 
                 w-full max-w-[360px] sm:max-w-[280px]" // 👈 در موبایل کوچکتر
    >
      <div className="w-full aspect-square overflow-hidden bg-white">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover sm:max-h-[220px]" // 👈 ارتفاع کمتر در موبایل
          loading="lazy"
        />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm sm:text-xs font-bold text-zinc-800">{name}</h3>
        <span className="text-pink-600 font-extrabold text-base sm:text-sm">
          {priceFormatter.format(price)} تومان
        </span>
      </div>
    </Link>
  );
}
