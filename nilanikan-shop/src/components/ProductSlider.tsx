"use client";

import Image from "next/image";
import Link from "next/link";

type Product = { id: number|string; name: string; image: string; price: number; href?: string };
const toFa = (n: number) => n.toLocaleString("fa-IR");

const data: Product[] = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  name: `محصول محبوب ${i + 1}`,
  image: `https://picsum.photos/seed/pop-${i + 1}/600`,
  price: 300000 + i * 10000,
}));

export default function ProductSlider() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" dir="rtl">
      {data.map((p) => (
        <article key={p.id} className="rounded-xl bg-white ring-1 ring-zinc-200 shadow hover:shadow-md transition overflow-hidden">
          <Link href={p.href ?? `/product/${p.id}`} className="block">
            <div className="relative w-full aspect-square">
              <Image src={p.image} alt={p.name} fill className="object-cover bg-[#F9F5F2]" />
            </div>
          </Link>
          <div className="p-3 text-right">
            <Link href={p.href ?? `/product/${p.id}`} className="block h-12 text-[13px] leading-6 text-slate-800 line-clamp-2 hover:text-pink-700" title={p.name}>{p.name}</Link>
            <div className="mt-2 text-sm font-bold text-slate-900">{toFa(p.price)} <span className="text-xs font-medium text-slate-500">تومان</span></div>
          </div>
        </article>
      ))}
    </div>
  );
}
