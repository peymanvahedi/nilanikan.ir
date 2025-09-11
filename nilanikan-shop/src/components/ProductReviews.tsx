// src/components/ProductReviews.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Review = {
  id: number;
  name: string;
  rating: number;  // 1..5
  comment: string;
  created_at: string;
};

type Props = {
  productId: number | string;
  productSlug?: string;
};

// اگر endpoints رو جایی دارید، از همون استفاده کنید.
// در غیر این صورت BASE_URL رو اینجا مشخص کنید.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const REVIEWS_URL = `${BASE_URL}/api/reviews/`;

export default function ProductReviews({ productId, productSlug }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const listUrl = useMemo(() => {
    const url = new URL(REVIEWS_URL);
    url.searchParams.set("product", String(productId));
    if (productSlug) url.searchParams.set("slug", productSlug);
    return url.toString();
  }, [productId, productSlug]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(listUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در دریافت دیدگاه‌ها");
      const data = await res.json();
      const results: Review[] = Array.isArray(data.results) ? data.results : [];
      setReviews(results);
      // avg/count را از سرور می‌گیریم؛ اما اینجا فقط avg محلی نیز داریم
    } catch (e: any) {
      setError(e?.message || "مشکلی پیش آمد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  const addReview = async () => {
    if (!name.trim() || !comment.trim()) {
      setError("نام و متن دیدگاه را وارد کنید.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setNotice(null);

      const payload = {
        product_id: productId,
        product_slug: productSlug || null,
        name: name.trim(),
        rating: Number(rating),
        comment: comment.trim(),
      };

      const res = await fetch(REVIEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "ارسال دیدگاه ناموفق بود.");
      }

      // سرور به‌جای برگرداندن آیتم، پیام می‌دهد که «در انتظار تأیید»
      setNotice("دیدگاه شما ثبت شد و پس از تأیید نمایش داده می‌شود.");
      setName("");
      setRating(5);
      setComment("");

      // عمداً لیست را آپدیت نمی‌کنیم؛ چون هنوز is_approved=False است.
      // اگر بخواهی می‌توانی بعد از چند ثانیه دوباره fetch بزنی.
      // setTimeout(fetchReviews, 2000);

    } catch (e: any) {
      setError(e?.message || "ارسال دیدگاه ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    return reviews.filter(r => String(r.rating) === filter);
  }, [reviews, filter]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    const s = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div>
          <div className="text-sm text-zinc-500">میانگین امتیاز</div>
          <div className="text-2xl font-bold">{avg} / 5</div>
          <div className="text-xs text-zinc-500 mt-1">{reviews.length} دیدگاه تأیید‌شده</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600">فیلتر:</label>
          <select
            className="rounded-xl border px-3 py-2 text-sm bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">همه امتیازها</option>
            <option value="5">فقط 5 ستاره</option>
            <option value="4">4 ستاره</option>
            <option value="3">3 ستاره</option>
            <option value="2">2 ستاره</option>
            <option value="1">1 ستاره</option>
          </select>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border p-4">
        <h3 className="font-bold mb-4">ثبت دیدگاه شما</h3>

        {notice && <div className="mb-3 text-sm text-emerald-600">{notice}</div>}
        {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-zinc-600">نام شما</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: سارا"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-zinc-600">امتیاز</label>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              disabled={submitting}
            >
              {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ستاره</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm text-zinc-600">متن دیدگاه</label>
            <textarea
              className="w-full rounded-xl border px-3 py-2 min-h-[120px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="تجربه‌تان از این محصول را بنویسید..."
              disabled={submitting}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={addReview}
            disabled={submitting}
            className="rounded-2xl bg-black text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "در حال ارسال..." : "ارسال دیدگاه"}
          </button>
          <span className="text-xs text-zinc-500">
            با ارسال دیدگاه، شرایط استفاده را می‌پذیرید. (پس از تأیید نمایش داده می‌شود)
          </span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-sm text-zinc-500">در حال بارگذاری دیدگاه‌ها…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-zinc-500">هنوز دیدگاه تأیید‌شده‌ای ثبت نشده است.</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-bold">{r.name}</div>
                <div className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString("fa-IR")}
                </div>
              </div>
              <div className="mt-1 text-yellow-500" aria-label={`rating ${r.rating}`}>
                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-800 whitespace-pre-wrap">
                {r.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
