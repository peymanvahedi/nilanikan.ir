// src/components/BannersRow.tsx
"use client";

import SafeImg from "@/components/SafeImg";
import Link from "next/link";
import type { BannerItem } from "@/types/home";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

function resolveImage(src?: string | null, seed?: string) {
  if (!src) return `https://picsum.photos/seed/${encodeURIComponent(seed || "banner")}/1200/600`;
  return /^https?:\/\//i.test(src) ? src : `${API_ORIGIN}${src}`;
}

type Props = { items?: BannerItem[] };

export default function BannersRow({ items = [] }: Props) {
  const list = Array.isArray(items) ? items.slice(0, 2) : [];

  if (!list.length) return null;

  return (
    <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((b, idx) => {
        const src = resolveImage(b.imageUrl, String(b.id ?? idx + 1));
        const content = (
          <div className="banner-card block overflow-hidden rounded-2xl ring-1 ring-zinc-100">
            <SafeImg
              src={src}
              alt={b.title || `بنر ${idx + 1}`}
              className="w-full h-auto object-cover"
            />
          </div>
        );

        return b.link ? (
          <Link key={String(b.id ?? idx)} href={b.link}>
            {content}
          </Link>
        ) : (
          <div key={String(b.id ?? idx)}>{content}</div>
        );
      })}
    </div>
  );
}
