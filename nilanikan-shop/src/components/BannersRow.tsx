"use client";

import SafeImg from "@/components/SafeImg";
import Link from "next/link";
import type { BannerItem } from "@/types/home";
import { API_BASE } from "@/lib/api";

// دامنهٔ اصلی (بدون /api انتهایی)
const API_ORIGIN = API_BASE.replace(/\/$/, "").replace(/\/api$/, "");

// ✅ آدرس تصویر را به‌درستی بساز (چه مطلق باشد چه نسبی)
function resolveImage(src?: string | null) {
  if (!src) return "";

  // اگر آدرس از قبل کامل (http یا https) بود همان را برگردان
  if (/^https?:\/\//i.test(src)) return src;

  // اگر آدرس با / شروع می‌شود یعنی از ریشه‌ی دامنه است → فقط دامنه را بچسبان
  if (src.startsWith("/")) {
    return `${API_ORIGIN}${src}`;
  }

  // در غیر این صورت رشته را مستقیماً بعد از دامنه بگذار
  return `${API_ORIGIN}/${src}`;
}

type Props = { items?: BannerItem[] };

export default function BannersRow({ items = [] }: Props) {
  const list = Array.isArray(items) ? items.slice(0, 2) : [];

  if (!list.length) return null;

  return (
    <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((b, idx) => {
        const src = resolveImage(b.imageUrl);
        if (!src) return null; // اگر تصویر نبود، چیزی نمایش نده
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
