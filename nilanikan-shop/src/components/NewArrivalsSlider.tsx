// src/components/NewArrivalsSlider.tsx
"use client";
import SafeImg from "@/components/SafeImg";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import type { ProductItem } from "@/types/home";

function ProductCard({ p }: { p: ProductItem }) {
  const hasCompare =
    typeof p.compareAtPrice === "number" && (p.compareAtPrice ?? 0) > p.price;
  const percent = hasCompare
    ? Math.round(
        (((p.compareAtPrice as number) - p.price) / (p.compareAtPrice as number)) * 100
      )
    : 0;

  return (
    <Link href={p.link || "#"} className="block group">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 relative">
        <SafeImg
          src={p.imageUrl}
          alt={p.title}
          className="w-full ه-full object-cover group-hover:scale-105 transition"
        />
        {hasCompare && percent > 0 && (
          <span className="absolute top-2 right-2 rounded-full bg-rose-600 text-white text-[11px] font-extrabold px-2 py-1 shadow">
            %{percent}
          </span>
        )}
      </div>

      {/* نام جذاب‌تر */}
      <div className="mt-2 text-[13px] font-semibold text-slate-800 line-clamp-2 group-hover:text-rose-600 transition">
        {p.title}
      </div>

      {/* قیمت شاخص */}
      {typeof p.price === "number" && (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-rose-600 font-extrabold text-sm">
            {p.price.toLocaleString("fa-IR")}
            <span className="text-[11px] ml-1 text-slate-500">تومان</span>
          </span>
          {hasCompare && (
            <span className="text-xs text-slate-400 line-through">
              {(p.compareAtPrice as number).toLocaleString("fa-IR")} تومان
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function NewArrivalsSlider({ products }: { products: ProductItem[] }) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">جدیدترین‌ها</h2>
        <Link href="/new-arrivals" className="underline text-sm">
          مشاهده همه
        </Link>
      </div>

      <Swiper
        modules={[Navigation]}
        navigation
        slidesPerView={2.2}
        spaceBetween={12}
        dir="rtl"
        breakpoints={{
          640: { slidesPerView: 3.2 },
          1024: { slidesPerView: 5 },
        }}
      >
        {(products ?? []).slice(0, 8).map((p) => (
          <SwiperSlide key={p.id}>
            <ProductCard p={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
