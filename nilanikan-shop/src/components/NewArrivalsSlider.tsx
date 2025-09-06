"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import type { ProductItem } from "@/types/home";

function ProductCard({ p }: { p: ProductItem }) {
  return (
    <Link href={p.link || "#"} className="block group">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50">
        <img
          src={p.imageUrl}
          alt={p.title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
      </div>
      <div className="mt-2 text-sm line-clamp-2">{p.title}</div>
      {typeof p.price === "number" && (
        <div className="text-sm font-bold mt-1">
          {p.price.toLocaleString()} تومان
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
