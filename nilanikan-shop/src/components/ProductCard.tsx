"use client";

import Link from "next/link";

const priceFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

type ProductCardProps = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  sizeChart?: { size: string; chest: number; waist: number; hip: number; sleeve: number; pantsLength: number }[];  // اضافه کردن سایزبندی
};

export default function ProductCard({ id, slug, name, price, image, sizeChart }: ProductCardProps) {
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
        
        {/* نمایش جدول سایزبندی */}
        {sizeChart && sizeChart.length > 0 && (
          <div className="mt-2 text-xs text-zinc-600">
            <h4 className="font-semibold">جدول سایزبندی</h4>
            <table className="w-full mt-1 border-collapse">
              <thead>
                <tr>
                  <th className="border-b py-1 px-2">سایز</th>
                  <th className="border-b py-1 px-2">دور سینه</th>
                  <th className="border-b py-1 px-2">دور کمر</th>
                  <th className="border-b py-1 px-2">دور باسن</th>
                  <th className="border-b py-1 px-2">قد آستین</th>
                  <th className="border-b py-1 px-2">قد شلوار</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((size) => (
                  <tr key={size.size}>
                    <td className="border-b py-1 px-2">{size.size}</td>
                    <td className="border-b py-1 px-2">{size.chest}</td>
                    <td className="border-b py-1 px-2">{size.waist}</td>
                    <td className="border-b py-1 px-2">{size.hip}</td>
                    <td className="border-b py-1 px-2">{size.sleeve}</td>
                    <td className="border-b py-1 px-2">{size.pantsLength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Link>
  );
}
