// src/components/ProductReviewSummary.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  productId: number | string;
  productSlug?: string | null;
  className?: string;
};

type ListResp = {
  results: Array<any>;
  avg: number;
  count: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const REVIEWS_URL = `${BASE_URL}/api/reviews/`;

function toFa(n: number) {
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

export default function ProductReviewSummary({ productId, productSlug, className = "" }: Props) {
  const [avg, setAvg] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const url = useMemo(() => {
    const u = new URL(REVIEWS_URL);
    u.searchParams.set("product", String(productId));
    if (productSlug) u.searchParams.set("slug", String(productSlug));
    return u.toString();
  }, [productId, productSlug]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data: ListResp = await res.json();
        if (!alive) return;
        setAvg(Number(data?.avg || 0));
        setCount(Number(data?.count || 0));
      } catch {
        // سکوت
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className={`mt-3 flex items-center gap-4 text-sm text-zinc-400 ${className}`}>
        <span className="inline-block h-4 w-24 rounded bg-zinc-100" />
        <span className="inline-block h-4 w-20 rounded bg-zinc-100" />
      </div>
    );
  }

  return (
    <div className={`mt-3 flex items-center gap-4 text-sm ${className}`} dir="rtl">
      <div className="flex items-center gap-1 text-amber-500">
        <span className="font-bold text-zinc-700">امتیاز</span>
        <span className="font-extrabold text-zinc-800">{toFa(avg)}</span>
        <span aria-hidden>★</span>
      </div>
      <span className="text-zinc-300">|</span>
      <div className="flex items-center gap-1 text-zinc-600">
        <span className="font-bold">{toFa(count)}</span>
        <span>دیدگاه</span>
      </div>
    </div>
  );
}
