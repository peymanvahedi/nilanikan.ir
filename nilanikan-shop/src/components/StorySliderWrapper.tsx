"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

function resolveImage(src?: string | null, seed?: string) {
  if (!src) return `https://picsum.photos/seed/${encodeURIComponent(seed || "story")}/600`;
  return /^https?:\/\//i.test(src) ? src : `${API_ORIGIN}${src}`;
}

type StoryItem = {
  id: number;
  title: string;
  image?: string | null;
  link?: string | null;
  product?: { slug?: string | null } | null;
};

type Props = { limit?: number; items?: any[] };

export default function StorySliderWrapper({ limit = 12, items }: Props) {
  const [remoteItems, setRemoteItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(!items);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (items && Array.isArray(items) && items.length) return;
    let mounted = true;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const url = `${API_ORIGIN}/api/stories/?limit=${encodeURIComponent(String(limit))}`;
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("خطا در دریافت استوری‌ها");
        const data = await res.json();
        const list: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.items)
          ? data.items
          : [];
        const rows: StoryItem[] = list.map((r: any, i: number) => ({
          id: Number(r.id ?? i + 1),
          title: String(r.title ?? r.name ?? ""),
          image: r.imageUrl ?? r.image ?? r.product?.image ?? null,
          link: r.link ?? r.href ?? null,
          product: r.product
            ? { slug: r.product.slug ?? r.product_slug ?? null }
            : r.product_slug
            ? { slug: r.product_slug }
            : null,
        }));
        if (mounted) setRemoteItems(rows);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "خطای ناشناخته");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [items, limit]);

  const stories = useMemo(() => {
    const source = items && Array.isArray(items) ? items : remoteItems;
    return (source || [])
      .slice(0, limit)
      .map((s, i) => {
        const img = resolveImage(s.image, s.title || String(i + 1));
        const href = s.link || (s.product?.slug ? `/product/${s.product.slug}` : undefined);
        return { id: s.id, title: s.title, src: img, href };
      })
      .filter((s) => !!s.src);
  }, [items, remoteItems, limit]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;
  const current = isOpen ? stories[openIndex!] : null;

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    if (!stories.length || openIndex === null) return;
    setOpenIndex((i) => ((i! + 1) % stories.length));
  }, [stories, openIndex]);
  const prev = useCallback(() => {
    if (!stories.length || openIndex === null) return;
    setOpenIndex((i) => ((i! - 1 + stories.length) % stories.length));
  }, [stories, openIndex]);

  if (!items && loading) return <div className="text-sm text-zinc-500">در حال بارگذاری استوری‌ها…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!stories.length) return <div className="text-sm text-zinc-500">استوری فعالی نداریم.</div>;

  return (
    <>
      {/* کارت‌های استوری */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-3">
        {stories.map((s, idx) => (
          <div
            key={s.id}
            className="flex-shrink-0 w-40 h-56 rounded-2xl bg-white shadow-md border border-zinc-200 overflow-hidden hover:shadow-lg transition"
          >
            <button onClick={() => setOpenIndex(idx)} className="block w-full h-full">
              <div className="relative w-full h-full">
                <Image src={s.src} alt={s.title} fill className="object-cover" />
                {/* عنوان روی تصویر با گرادیانت قوی‌تر */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-2">
                  <p className="text-sm font-bold text-white text-center truncate">
                    {s.title}
                  </p>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* پاپ‌آپ نمایش استوری */}
      {isOpen && current && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-sm">
            <Image
              src={current.src}
              alt={current.title}
              width={800}
              height={1200}
              className="w-full h-auto rounded-2xl"
              priority
            />
            <div className="mt-2 flex items-center justify-between text-white">
              <button onClick={prev} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">قبلی</button>
              <div className="text-sm">{current.title}</div>
              <button onClick={next} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">بعدی</button>
            </div>
            <button
              onClick={close}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white text-black font-bold"
              aria-label="بستن"
              title="بستن"
            >
              ×
            </button>
            {current.href && (
              <Link href={current.href} className="mt-3 block text-center rounded-xl bg-pink-600 px-4 py-2 text-white hover:bg-pink-700">
                مشاهده محصول
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
