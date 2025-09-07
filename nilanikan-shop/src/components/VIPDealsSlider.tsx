"use client";
import SafeImg from "@/components/SafeImg";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { ProductItem } from "@/types/home";

function Countdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return <span className="font-mono">{left}</span>;
}

function ProductCard({ p }: { p: ProductItem }) {
  const hasDiscount =
    typeof p.compareAtPrice === "number" && p.compareAtPrice > (p.price ?? 0);
  const percent = hasDiscount
    ? Math.round(((p.compareAtPrice! - (p.price ?? 0)) / p.compareAtPrice!) * 100)
    : 0;

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

      <div className="flex items-center gap-2 mt-1 text-sm">
        {typeof p.price === "number" && (
          <span className="font-bold">{p.price.toLocaleString()} تومان</span>
        )}
        {hasDiscount && (
          <>
            <del className="text-xs text-gray-400">
              {p.compareAtPrice!.toLocaleString()}
            </del>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              %{percent}
            </span>
          </>
        )}
      </div>

      {p.badge ? (
        <div className="text-[10px] mt-1 text-amber-700">{p.badge}</div>
      ) : null}
    </Link>
  );
}

export default function VIPDealsSlider({
  products,
  endsAt,
  seeAllLink,
}: {
  products: ProductItem[];
  endsAt: string;
  seeAllLink?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">پکیج VIP</h2>
          <div className="text-sm bg-black text-white px-3 py-1 rounded-full">
            <Countdown endsAt={endsAt} />
          </div>
        </div>
        {seeAllLink && (
          <Link href={seeAllLink} className="underline">
            مشاهده همه
          </Link>
        )}
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
        {(products ?? []).map((p) => (
          <SwiperSlide key={p.id}>
            <ProductCard p={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
