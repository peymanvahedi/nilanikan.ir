"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type DealItem = {
  id: number | string;
  name: string;
  image: string;
  price: number;       // قیمت نهایی (بعد از تخفیف)
  oldPrice?: number;   // قیمت اصلی
  href?: string;
};

const toFa = (n: number) => n.toLocaleString("fa-IR");

export default function AmazingDealsSlider({
  items,
  title = "شگفت‌انگیز محصولات",
  countdownSeconds = 4 * 60 * 60,
  allLink = "/products",
}: {
  items?: DealItem[];
  title?: string;
  countdownSeconds?: number;
  allLink?: string;
}) {
  const fallback: DealItem[] = [
    { id: 1, name: "کلاه بچگانه", image: "https://picsum.photos/seed/deal-1/600", price: 1200000, oldPrice: 1690000 },
    { id: 2, name: "تی‌شرت دخترانه", image: "https://picsum.photos/seed/deal-2/600", price: 2100000, oldPrice: 2940000 },
    { id: 3, name: "شلوار لی کودک", image: "https://picsum.photos/seed/deal-3/600", price: 4200000, oldPrice: 5880000 },
    { id: 4, name: "هودی تدی", image: "https://picsum.photos/seed/deal-4/600", price: 1750000, oldPrice: 2320000 },
  ];

  // اگر props خالی بود fallback استفاده میشه
  const data = (items?.length ? items : fallback).map((x) => ({
    ...x,
    href: x.href ?? `/product/${x.id}`,
  }));

  // تایمر شمارش معکوس
  const [left, setLeft] = useState(countdownSeconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [countdownSeconds]);

  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <section className="w-full" dir="rtl" aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-extrabold text-pink-600">{title}</h2>
        <div className="text-sm font-bold text-slate-700">
          زمان باقی‌مانده: {hh}:{mm}:{ss}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((p) => (
          <article
            key={p.id}
            className="rounded-xl bg-white ring-1 ring-zinc-200 shadow hover:shadow-md transition overflow-hidden"
          >
            <Link href={p.href!} className="block">
              <div className="relative w-full aspect-square">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover bg-[#F9F5F2]"
                />
              </div>
            </Link>
            <div className="p-3 text-right">
              <Link
                href={p.href!}
                className="block h-12 text-[13px] leading-6 text-slate-800 line-clamp-2 hover:text-pink-700"
                title={p.name}
              >
                {p.name}
              </Link>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-sm font-bold text-slate-900">
                  {toFa(p.price)}{" "}
                  <span className="text-xs font-medium text-slate-500">
                    تومان
                  </span>
                </div>
                {p.oldPrice && (
                  <div className="text-xs line-through text-slate-400">
                    {toFa(p.oldPrice)} تومان
                  </div>
                )}
                {p.oldPrice && p.oldPrice > p.price && (
                  <span className="ml-auto rounded bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-600">
                    %{Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 text-left">
        <Link
          href={allLink}
          className="inline-flex h-10 items-center rounded-lg bg-pink-600 px-4 text-white text-sm font-bold hover:bg-pink-700"
        >
          مشاهده همه
        </Link>
      </div>
    </section>
  );
}
