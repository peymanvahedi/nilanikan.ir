"use client";
import SafeImg from "@/components/SafeImg";

import Link from "next/link";
import type { BannerItem } from "@/types/home";

export default function BannersRow({ banners }: { banners: BannerItem[] }) {
  return (
    <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {(banners ?? []).slice(0, 2).map((b) => {
        const content = (
          <div className="banner-card block">
            <SafeImg
              src={b.imageUrl}
              alt={b.title}
              className="w-full h-48 md:h-60 object-cover rounded-2xl"
            />
            <div className="mt-2">
              <div className="font-bold">{b.title}</div>
              {b.subtitle ? (
                <div className="text-sm text-gray-600">{b.subtitle}</div>
              ) : null}
            </div>
          </div>
        );

        return b.link ? (
          <Link key={b.id} href={b.link}>
            {content}
          </Link>
        ) : (
          <div key={b.id}>{content}</div>
        );
      })}
    </div>
  );
}
