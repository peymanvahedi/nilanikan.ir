"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Slide as HomeSlide } from "@/types/home";

type Slide = { id?: number | string; src: string; href?: string; alt?: string };
type Props = { slides?: HomeSlide[] };

const AUTOPLAY_MS = 5000;

function normalize(input?: HomeSlide[]): Slide[] {
  if (!input?.length) return [];
  return input.map((s, i) => ({
    id: s.id ?? i + 1,
    src: (s as any).imageUrl ?? (s as any).image ?? "",
    href: (s as any).link ?? (s as any).href ?? undefined,
    alt: s.alt ?? s.title ?? `banner ${i + 1}`,
  }));
}

export default function BannerSlider({ slides }: Props) {
  const [items, setItems] = useState<Slide[]>(normalize(slides));
  const [index, setIndex] = useState(0);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(normalize(slides));
  }, [slides]);

  function goTo(i: number) {
    const len = items.length;
    if (!len) return;
    const next = ((i % len) + len) % len;
    setIndex(next);
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${-next * 100}%, 0, 0)`;
  }

  function start() {
    stop();
    if (items.length <= 1) return;
    timerRef.current = setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
  }

  function stop() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    if (items.length <= 1) return;
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length]);

  if (!items.length) return null;

  return (
    <section className="relative z-20 w-full select-none" aria-label="اسلایدر بنر">
      <div
        ref={containerRef}
        className="
          relative w-full overflow-hidden rounded-xl bg-zinc-100
          h-[220px] sm:h-[280px] md:h-[360px] lg:h-[420px] xl:h-[460px]
        "
        onMouseEnter={stop}
        onMouseLeave={start}
      >
        {/* track */}
        <div
          ref={trackRef}
          className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: "translate3d(0,0,0)" }}
          dir="ltr"
        >
          {items.map((s, i) => {
            const img = (
              <Image
                key={s.id ?? i}
                src={s.src}
                alt={s.alt || `banner ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
                unoptimized
                onError={(e) => {
                  console.warn("Banner image failed:", s.src, e);
                }}
              />
            );
            return (
              <div key={`slide-${s.id ?? i}`} className="relative shrink-0 w-full h-full">
                {s.href ? <Link href={s.href}>{img}</Link> : img}
              </div>
            );
          })}
        </div>

        {/* dots */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/25 backdrop-blur rounded-full px-2 py-1">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2.5 bg-white/70 hover:bg-white"
                }`}
                aria-label={`اسلاید ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
