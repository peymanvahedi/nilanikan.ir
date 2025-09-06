"use client";

import { Swiper, SwiperSlide } from "swiper/react";

type StoryItem = {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
};

export default function MiniLooksSlider({ items }: { items: StoryItem[] }) {
  return (
    <div className="py-6">
      <Swiper
        slidesPerView={2.5}   // موبایل: ۲ تا و نصف
        spaceBetween={8}
        dir="rtl"
        breakpoints={{
          640: { slidesPerView: 4 },   // تبلت
          1024: { slidesPerView: 6 },  // دسکتاپ
        }}
      >
        {items.slice(0, 10).map((it) => (
          <SwiperSlide key={it.id}>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-50">
              <img
                src={it.imageUrl}
                alt={it.title}
                className="w-full h-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
