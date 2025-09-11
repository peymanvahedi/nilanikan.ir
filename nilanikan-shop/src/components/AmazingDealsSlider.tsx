"use client";
import SafeImg from "@/components/SafeImg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductItem } from "@/types/home";

/** شمارش‌معکوس (اختیاری) */
function Countdown({ endsAt }: { endsAt?: string }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const end = new Date(endsAt).getTime();
      const diff = end - Date.now();
      if (diff <= 0) return setTxt("00:00:00");
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setTxt(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!endsAt) return null;
  return <span className="text-sm font-bold text-slate-700">{txt}</span>;
}

export default function AmazingDealsSlider({
  title = "شگفت‌انگیزها",
  products = [],
  endsAt,
  seeAllLink = "/products",
}: {
  title?: string;
  products?: ProductItem[];
  endsAt?: string;
  seeAllLink?: string;
}) {
  return (
    <section className="w-full" dir="rtl" aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-extrabold text-pink-600">{title}</h2>
        <div className="flex items-center gap-2">
          <Countdown endsAt={endsAt} />
          <Link
            href={seeAllLink}
            className="inline-flex h-9 items-center rounded-lg bg-pink-600 px-3 text-white text-sm font-bold hover:bg-pink-700"
          >
            مشاهده همه
          </Link>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={12}
        slidesPerView={2.2}
        breakpoints={{ 640: { slidesPerView: 3.2 }, 1024: { slidesPerView: 5 } }}
        dir="rtl"
      >
        {(products ?? []).map((p) => {
          const hasCompare =
            typeof p.compareAtPrice === "number" && (p.compareAtPrice ?? 0) > p.price;
          const percent = hasCompare
            ? Math.round((((p.compareAtPrice as number) - p.price) / (p.compareAtPrice as number)) * 100)
            : 0;

          return (
            <SwiperSlide key={p.id}>
              <Link href={p.link || "#"} className="block group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 relative">
                  <SafeImg
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  {hasCompare && percent > 0 && (
                    <span className="absolute top-2 right-2 rounded-full bg-rose-600 text-white text-[11px] font-extrabold px-2 py-1 shadow">
                      %{percent}
                    </span>
                  )}
                </div>

                <h3 className="mt-2 text-sm line-clamp-2">{p.title}</h3>

                {typeof p.price === "number" && (
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {p.price.toLocaleString("fa-IR")}{" "}
                    <span className="text-xs font-medium text-slate-500">تومان</span>
                  </div>
                )}

                {hasCompare && (
                  <div className="text-xs text-slate-400 line-through mt-0.5">
                    {(p.compareAtPrice as number).toLocaleString("fa-IR")} تومان
                  </div>
                )}
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
