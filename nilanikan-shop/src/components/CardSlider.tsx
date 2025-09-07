"use client";
import SafeImg from "@/components/SafeImg";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";

type CardItem = { id: string; title: string; imageUrl: string; link?: string };

export default function CardSlider({
  title,
  items,
  ctaHref,
  ctaText = "مشاهده همه",
}: {
  title: string;
  items: CardItem[];
  ctaHref?: string;
  ctaText?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {ctaHref && (
          <Link href={ctaHref} className="underline">
            {ctaText}
          </Link>
        )}
      </div>
      <Swiper
        modules={[Navigation]}
        navigation
        slidesPerView={2.4}
        spaceBetween={12}
        dir="rtl"
        breakpoints={{
          640: { slidesPerView: 4 },
          1024: { slidesPerView: 6 },
        }}
      >
        {items.slice(0, 20).map((it) => (
          <SwiperSlide key={it.id}>
            <Link href={it.link || "#"} className="block group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50">
                <SafeImg
                  src={it.imageUrl}
                  alt={it.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <div className="mt-2 text-sm line-clamp-1 text-center">
                {it.title}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
