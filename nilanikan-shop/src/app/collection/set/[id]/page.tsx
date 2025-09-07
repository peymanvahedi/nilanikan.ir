"use client";
import SafeImg from "@/components/SafeImg";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { get, endpoints } from "@/lib/api";
import { formatToman, toTomanNumber } from "@/lib/money";
import ImageGallery from "@/components/ImageGallery";
import { addManyToCart } from "@/lib/cart";

export default function BundlePage() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<any>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await get(`${endpoints.bundles}${id}/`);
        setBundle(data);
        setSelected(data?.products?.map((p: any) => p.id) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // همیشه اجرا شود (ترتیب هوک‌ها ثابت بماند)
  const gallery = useMemo<string[]>(() => {
    const extra = (bundle?.gallery ?? bundle?.images ?? bundle?.photos ?? []) as Array<
      string | null | undefined
    >;
    const arr = [bundle?.image, ...extra].filter(
      (x): x is string => typeof x === "string" && x.length > 0
    );
    return arr.length ? arr : ["https://picsum.photos/seed/bundle/800"];
  }, [bundle]);

  if (loading) return <div className="p-8">در حال بارگذاری...</div>;
  if (!bundle) return <div className="p-8">باندل پیدا نشد</div>;

  // قیمت‌ها
  const fullPriceT = toTomanNumber(bundle?.price) ?? 0;
  const selectedPriceT =
    bundle?.products?.reduce((sum: number, p: any) => {
      if (!selected.includes(p.id)) return sum;
      return sum + (toTomanNumber(p?.price) ?? 0);
    }, 0) ?? 0;

  const toggleProduct = (pid: number) =>
    setSelected((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));

  const handleAdd = async () => {
    if (!bundle?.products?.length) return;
    const items = bundle.products
      .filter((p: any) => selected.includes(p.id))
      .map((p: any) => ({
        id: p.id,
        name: p.name || p.title || `محصول ${p.id}`,
        price: Number(p.price) || 0,
        image: p.image || p.images?.[0] || null,
      }));
    if (!items.length) return;

    setAdding(true);
    try {
      await addManyToCart(items, 1);
      alert("به سبد افزوده شد.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" dir="rtl">
      {/* در دسکتاپ: ۳ ستون (گالری+جزئیات / سایدبار کوچک) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* گالری + جزئیات */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageGallery images={gallery} alt={bundle?.title ?? "باندل"} />

          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-slate-900">{bundle?.title}</h1>
            <p className="text-slate-600">{bundle?.description}</p>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-800">
                قیمت کل باندل: {formatToman(fullPriceT)} تومان
              </p>
              <p className="text-xl font-bold text-pink-600">
                قیمت انتخاب شما: {formatToman(selectedPriceT)} تومان
              </p>
            </div>

            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-lg font-bold transition"
            >
              {adding ? "در حال افزودن..." : "افزودن به سبد خرید"}
            </button>
          </div>
        </div>

        {/* سایدبار کوچک محصولات (فقط دسکتاپ) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <h3 className="font-bold text-slate-900 mb-2">محصولات داخل باندل</h3>
            {bundle?.products?.map((p: any) => (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-2 rounded-xl border ${
                  selected.includes(p.id) ? "border-pink-300 ring-1 ring-pink-200" : "border-zinc-200"
                } hover:border-pink-300 transition cursor-pointer`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                <SafeImg
                  src={p?.image || (p?.images?.[0] ?? "https://picsum.photos/seed/product/200")}
                  alt={p?.name ?? "محصول"}
                  className="w-14 h-14 rounded-lg object-cover bg-white"
                />
                <div className="flex-1 text-right">
                  <div className="text-[13px] font-semibold line-clamp-2">{p?.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{formatToman(p?.price)} تومان</div>
                </div>
              </label>
            ))}
          </div>
        </aside>
      </div>

      {/* گرید موبایل/تبلت */}
      <div className="mt-12 lg:hidden">
        <h2 className="text-2xl font-bold mb-6">انتخاب محصولات داخل باندل</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {bundle?.products?.map((p: any) => (
            <div
              key={p.id}
              className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition ${
                selected.includes(p.id) ? "ring-2 ring-pink-500" : ""
              }`}
            >
              <div className="relative w-full aspect-square bg-white">
                <SafeImg
                  src={p?.image || (p?.images?.[0] ?? "https://picsum.photos/seed/product/400")}
                  alt={p?.name ?? "محصول"}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-3 text-right space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-sm font-semibold line-clamp-2">{p?.name}</span>
                </label>
                <p className="text-xs text-slate-500">{formatToman(p?.price)} تومان</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
