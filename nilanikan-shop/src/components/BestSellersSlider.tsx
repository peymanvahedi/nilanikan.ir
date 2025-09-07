"use client";
import SafeImg from "@/components/SafeImg";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";

type ProductItem = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  link?: string;
};

function ProductCard({ p }: { p: ProductItem }) {
  return (
    <Link href={p.link || "#"} className="block group">
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-50">
        <SafeImg
          src={p.imageUrl}
          alt={p.title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
      </div>
      <div className="mt-2 text-sm line-clamp-2">{p.title}</div>
      <div className="text-sm font-bold mt-1">{p.price.toLocaleString()} تومان</div>
    </Link>
  );
}

export default function BestSellersSlider({ products }: { products: ProductItem[] }) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">پرفروش‌ترین‌ها</h2>
        <Link href="/best-sellers" className="underline text-sm">
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
        {products.map((p) => (
          <SwiperSlide key={p.id}>
            <ProductCard p={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
