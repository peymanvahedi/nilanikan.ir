"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = { id: number; src: string; href?: string; alt?: string };

const slides: Slide[] = [
  { id: 1, src: "/banners/banner-1.jpg", alt: "بنر ۱" },
  { id: 2, src: "/banners/banner-2.jpg", alt: "بنر ۲" },
  { id: 3, src: "/banners/banner-3.jpg", alt: "بنر ۳" },
];

const AUTOPLAY_MS = 5000;

export default function BannerSlider() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goTo(i: number) {
    setIndex(i);
    const track = trackRef.current;
    if (!track) return;
    // همیشه به سمت چپ اسلاید کن
    track.style.transform = `translateX(${-i * 100}%)`;
  }

  function start() {
    stop();
    timerRef.current = setTimeout(() => {
      goTo((index + 1) % slides.length);
    }, AUTOPLAY_MS);
  }
  function stop() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // autoplay
  useEffect(() => {
    if (slides.length <= 1) return;
    start();
    return stop;
  }, [index]);

  // swipe موبایل
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let startX = 0;
    let dx = 0;

    const onTouchStart = (e: TouchEvent) => {
      stop();
      startX = (e.touches[0] as Touch).clientX;
      dx = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      dx = (e.touches[0] as Touch).clientX - startX;
    };
    const onTouchEnd = () => {
      if (Math.abs(dx) > 40) {
        const next = dx < 0 ? index + 1 : index - 1;
        goTo((next + slides.length) % slides.length);
      } else {
        start();
      }
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: true });
    node.addEventListener("touchend", onTouchEnd);

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
    };
  }, [index]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative z-20 w-full select-none"
      aria-label="اسلایدر بنر"
    >
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] md:aspect-[16/5] max-h-[460px] overflow-hidden rounded-xl bg-zinc-100"
      >
        {/* track */}
        <div
          ref={trackRef}
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: "translateX(0%)" }}
          dir="ltr"
        >
          {slides.map((s) => (
            <div key={s.id} className="relative shrink-0 w-full h-full">
              <Image
                src={s.src}
                alt={s.alt ?? "banner"}
                fill
                className="object-cover"
                sizes="100vw"
                priority={s.id === 1}
              />
            </div>
          ))}
        </div>

        {/* دات‌ها */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur rounded-full px-2 py-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`اسلاید ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
