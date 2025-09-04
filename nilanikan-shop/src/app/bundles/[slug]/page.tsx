// src/app/bundle/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { get, endpoints } from "@/lib/api";
import { addManyToCart } from "@/lib/cart";

/* --- helpers --- */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && (window as any).__NEXT_PUBLIC_API_URL__) ||
  "http://localhost:8000";

const toAbs = (u?: string | null) =>
  !u ? null : /^https?:|^data:/i.test(u) ? u : `${API_BASE}${u.startsWith("/") ? u : `/${u}`}`;

type BundleProduct = {
  id: number;
  slug?: string | null;
  name: string;
  image?: string | null;
  price: number;
};

type Bundle = {
  id: number;
  slug?: string | null;  // ← برای لینک‌دهی باندل‌های مشابه
  title: string;
  image?: string | null;
  price: number;
  items: BundleProduct[];
};

function normalizeProduct(p: any): BundleProduct {
  const node = p?.product ? { ...p.product, quantity: p?.quantity ?? 1 } : p;
  const id = Number(node?.id ?? node?.product_id ?? node?.pk ?? node?.product?.id ?? 0) || 0;
  const slug = node?.slug ?? node?.product?.slug ?? null;
  const name =
    node?.name ?? node?.title ?? node?.product?.name ?? (id ? `محصول ${id}` : "محصول");
  const price =
    Number(
      node?.final_price ??
        node?.discount_price ??
        node?.selling_price ??
        node?.unit_price ??
        node?.price ??
        0
    ) || 0;
  const image =
    toAbs(
      node?.image ??
        node?.thumbnail ??
        node?.images?.[0] ??
        node?.product?.image ??
        node?.product?.thumbnail
    ) || null;

  return { id, slug, name: String(name), image, price };
}

function normalizeBundle(b: any): Bundle {
  const itemsRaw: any[] =
    (Array.isArray(b?.items) && b.items) ||
    (Array.isArray(b?.products) && b.products) ||
    (Array.isArray(b?.bundle_items) && b.bundle_items) ||
    (Array.isArray(b?.items_list) && b.items_list) ||
    [];
  const items = itemsRaw.map(normalizeProduct).filter((x) => x.id);

  const id = Number(b?.id ?? b?.pk ?? 0) || 0;
  const slug = b?.slug ?? null; // ← اضافه شد
  const title = String(b?.title ?? b?.name ?? (id ? `باندل ${id}` : "باندل"));
  const bundleImage = toAbs(b?.image ?? b?.thumbnail ?? b?.images?.[0]) || items[0]?.image || null;

  const rawPrice = Number(
    b?.final_price ?? b?.discount_price ?? b?.selling_price ?? b?.price ?? 0
  );
  const price = rawPrice > 0 ? rawPrice : items.reduce((s, i) => s + (i.price || 0), 0);

  return { id, slug, title, image: bundleImage, price, items };
}

export default function BundlePage() {
  const params = useParams();
  const router = useRouter();

  const idOrSlug = useMemo(() => {
    const anyParams = params as Record<string, string | undefined>;
    return anyParams?.id || anyParams?.slug || "";
  }, [params]);

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // انتخاب چندگانه آیتم‌ها
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // گالری
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // باندل‌های مشابه برای اسلایدر (فقط باندل‌های «ست»)
  const [related, setRelated] = useState<Bundle[]>([]);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // فرمت قیمت
  const nf = useMemo(() => new Intl.NumberFormat("fa-IR"), []);
  const fmt = (n: number) => nf.format(Math.round(n));

  const selectedItems = useMemo(
    () => (bundle ? bundle.items.filter((i) => selectedIds.has(i.id)) : []),
    [bundle, selectedIds]
  );

  const displayPrice = useMemo(() => {
    if (!bundle) return 0;
    if (selectedIds.size === 0) return bundle.price;
    return selectedItems.reduce((s, i) => s + (i.price || 0), 0);
  }, [bundle, selectedIds, selectedItems]);

  const mainImage: string | null = useMemo(() => {
    if (activeImage) return activeImage;
    if (selectedItems.length === 1) return selectedItems.at(0)?.image ?? bundle?.image ?? null;
    return bundle?.image ?? null;
  }, [activeImage, selectedItems, bundle]);

  // بندانگشتی‌ها: تصویر باندل + همهٔ آیتم‌ها (بدون تکرار، تا 10 عدد)
const galleryThumbs = useMemo(() => {
  const s = new Set<string>();
  if (bundle?.image) s.add(bundle.image);
  for (const it of bundle?.items ?? []) {
    if (it?.image) s.add(it.image);
    if (s.size >= 10) break;
  }
  const arr = Array.from(s);
  // اگر خالی بود یک Placeholder بده
  if (arr.length === 0) arr.push("https://picsum.photos/seed/bundle/800/800");
  return arr;
}, [bundle]);

  // لود باندل
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        let data: any = null;
        try {
          data = await get(`${endpoints.bundles}${encodeURIComponent(idOrSlug)}/`, {
            cache: "no-store",
          } as any);
        } catch {}
        if (!data) {
          const list = await get(
            `${endpoints.bundles}?search=${encodeURIComponent(idOrSlug)}`,
            { cache: "no-store" } as any
          );
          data = Array.isArray(list?.results)
            ? list.results[0]
            : Array.isArray(list)
            ? list[0]
            : list;
        }
        if (!data) throw new Error("باندل پیدا نشد");
        if (!aborted) {
          const normalized = normalizeBundle(data);
          setBundle(normalized);
          setSelectedIds(new Set());
          setActiveImage(null);
        }
      } catch (e: any) {
        if (!aborted) setErr(e?.message || "خطا در دریافت اطلاعات باندل");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [idOrSlug]);

  // لود باندل‌های مشابه (فقط باندل‌هایی که در عنوانشان "ست" دارند)
  useEffect(() => {
    if (!bundle) return;

    const hasSet = (s?: string | null) => typeof s === "string" && s.includes("ست");

    (async () => {
      try {
        const res = await get(`${endpoints.bundles}?search=${encodeURIComponent("ست")}&limit=30`, {
          cache: "no-store",
        } as any);

        const rows: any[] = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
        let list = rows
          .map(normalizeBundle)
          .filter((b) => b?.id && hasSet(b?.title))
          .filter((b) => b.id !== bundle.id);

        setRelated(list.slice(0, 20));
      } catch {
        setRelated([]); // بدون fallback به محصولات/آیتم‌ها
      }
    })();
  }, [bundle]);

  // انتخاب/لغو
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => bundle && setSelectedIds(new Set(bundle.items.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // افزودن به سبد
  const addSelectedToCart = async () => {
    const items = selectedItems.length ? selectedItems : bundle?.items || [];
    if (items.length === 0) return;
    await addManyToCart(
      items.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        image: it.image ?? null,
      })),
      1
    );
    alert(
      selectedItems.length
        ? `${selectedItems.length} آیتم انتخابی به سبد اضافه شد.`
        : "تمام آیتم‌های باندل به سبد اضافه شد."
    );
  };

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-4" dir="rtl">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <div className="h-10 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div className="h-[50vh] rounded-3xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (err) return <div className="p-6 text-red-600" dir="rtl">{err}</div>;
  if (!bundle) return <div className="p-6" dir="rtl">چیزی پیدا نشد.</div>;

  const hero = mainImage || "https://picsum.photos/seed/bundle/1200/800";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
      {/* گرید LTR برای کنترل دقیق موقعیت ستون‌ها */}
      <div className="grid grid-cols-12 gap-6" dir="ltr">
        {/* چپ: انتخاب آیتم‌های باندل */}
        <aside className="col-span-12 lg:col-span-3 lg:col-start-1" dir="rtl">
          <div className="sticky top-4">
            <h2 className="mb-3 text-center text-lg font-semibold text-slate-800">
              انتخاب آیتم‌های باندل
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bundle.items.map((it) => {
                const checked = selectedIds.has(it.id);
                return (
                  <label
                    key={it.id}
                    className={[
                      "relative flex flex-col items-center gap-1 rounded-2xl border bg-white p-2 transition",
                      checked
                        ? "border-emerald-500/70 ring-2 ring-emerald-500/30"
                        : "border-slate-200 hover:shadow-sm",
                    ].join(" ")}
                    title={it.name}
                  >
                    <input
                      type="checkbox"
                      className="peer absolute right-2 top-2 h-4 w-4 cursor-pointer accent-emerald-600"
                      checked={checked}
                      onChange={() => toggleSelect(it.id)}
                    />
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={it.image || "https://picsum.photos/seed/prod/200"}
                        alt={it.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onMouseEnter={() => setActiveImage(it.image ?? null)}
                        onMouseLeave={() => setActiveImage(null)}
                      />
                    </div>
                    <div className="w-full text-center">
                      <div className="truncate text-[11px] font-medium text-slate-800">{it.name}</div>
                      <div className="text-[11px] font-semibold text-emerald-600">
                        {fmt(it.price)} <span className="font-normal">تومان</span>
                      </div>
                    </div>
                    <span
                      className={[
                        "absolute -top-1 -left-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        checked ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={selectAll}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                انتخاب همه
              </button>
              <button
                onClick={clearSelection}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                پاک‌کردن
              </button>
              <span className="mr-auto text-xs text-slate-500">
                {selectedIds.size ? `${selectedIds.size} انتخاب` : "بدون انتخاب"}
              </span>
            </div>
          </div>
        </aside>

        {/* وسط: عنوان/قیمت/CTA (نسخه حرفه‌ای بدون «موجود / ارسال سریع») */}
<section className="col-span-12 lg:col-span-4 lg:col-start-5" dir="rtl">
  <div className="sticky top-4 space-y-4">
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur">
      <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
        {bundle.title}
      </h1>

      {/* قیمت */}
      <div className="mt-4 text-center">
        <div className="text-xs text-slate-500">
          {selectedIds.size ? "مجموع آیتم‌های انتخاب‌شده" : "قیمت باندل"}
        </div>
        <div className="mt-1 inline-flex items-baseline gap-1 rounded-2xl bg-emerald-50 px-4 py-1.5 ring-1 ring-emerald-100">
          <span className="text-3xl font-black text-emerald-700 leading-none">
            {fmt(displayPrice)}
          </span>
          <span className="text-[12px] font-semibold text-emerald-700">تومان</span>
        </div>
      </div>

      {/* اکشن‌ها */}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={addSelectedToCart}
          className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {selectedIds.size ? "افزودن آیتم‌های انتخابی" : "افزودن تمام باندل"}
        </button>
        <a
          href="#bundle-items"
          className="rounded-2xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          مشاهده لیست آیتم‌ها
        </a>
      </div>

      {/* توضیح راهنما کوتاه‌تر */}
      <p className="mt-4 text-center text-[13px] leading-6 text-slate-500">
        از ستون چپ آیتم‌ها را انتخاب کنید. اگر انتخابی انجام نشود، کل باندل افزوده می‌شود.
      </p>
    </div>
  </div>
</section>


       {/* راست: گالری */}
<section className="col-span-12 lg:col-span-5 lg:col-start-9" dir="rtl">
  <div className="sticky top-4 space-y-3">
    {/* تصویر اصلی: object-contain تا تصویر کامل دیده شود */}
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* نسبت تصویر در موبایل مربعی، در دسکتاپ 4/3 */}
      <div className="aspect-square sm:aspect-[4/3] relative">
        <Image
          src={hero}
          alt={bundle.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-contain"   // ← قبلاً object-cover بود
        />
      </div>
    </div>

    {/* ردیف بندانگشتی‌ها: اسکرولی و بدون برش */}
    <div className="no-scrollbar flex gap-2 overflow-x-auto pr-1">
      {galleryThumbs.map((src, idx) => {
        const isActive = hero === src;
        return (
          <button
            key={idx}
            onClick={() => setActiveImage(src)}
            className={[
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition",
              isActive
                ? "border-emerald-500 ring-2 ring-emerald-500/40"
                : "border-slate-200 hover:shadow-sm",
            ].join(" ")}
            aria-label={`تصویر ${idx + 1}`}
          >
            <Image
              src={src}
              alt={`thumb-${idx}`}
              fill
              sizes="80px"
              className="object-contain bg-white"  // ← contain برای عدم برش
            />
          </button>
        );
      })}
    </div>
  </div>
</section>

      </div>

      {/* پایین: آیتم‌های داخل باندل (کوچیک و فشرده) */}
      <div id="bundle-items" className="mt-12">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">آیتم‌های داخل باندل</h3>
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {bundle.items.map((it) => (
            <a
              key={it.id}
              href={`/product/${it.slug ?? it.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={it.image || "https://picsum.photos/seed/prod/600"}
                  alt={it.name}
                  fill
                  sizes="(max-width: 768px) 33vw, 16vw"
                  className="object-cover transition group-hover:scale-[1.02]"
                />
              </div>
              <div className="mt-2 line-clamp-1 text-sm font-medium text-slate-800">
                {it.name}
              </div>
              <div className="text-[13px] font-semibold text-emerald-600">
                {fmt(it.price)} <span className="font-normal">تومان</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* اسلایدر باندل‌های مشابه (فقط «ست») */}
      <div className="mt-14">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">باندل‌های مشابه</h3>
          <div className="flex gap-2">
            <button
              onClick={() => sliderRef.current?.scrollBy({ left: -600, behavior: "smooth" })}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              ‹
            </button>
            <button
              onClick={() => sliderRef.current?.scrollBy({ left: +600, behavior: "smooth" })}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              ›
            </button>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pr-1"
        >
          {related.slice(0, 20).map((b) => (
            <a
              key={`rb-${b.id}-${b.title}`}
              href={`/bundle/${b.slug ?? b.id}`}
              className="snap-start shrink-0 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md transition"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={b.image || "https://picsum.photos/seed/bundle-rel/600"}
                  alt={b.title}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
              <div className="mt-2 line-clamp-1 text-sm font-medium text-slate-800">{b.title}</div>
              <div className="text-[13px] font-semibold text-emerald-600">
                {fmt(b.price)} <span className="font-normal">تومان</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* استایل برای مخفی کردن اسکرول‌بار در اسلایدر (اختیاری) */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
