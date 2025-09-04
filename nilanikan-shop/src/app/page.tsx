"use client";

import { useEffect, useState } from "react";
import BannerSlider from "../components/BannerSlider";
import CustomerCarousel from "../components/CustomerCarousel";
import AmazingDealsSlider, { type DealItem } from "../components/AmazingDealsSlider";
import NilaNikanSetsSlider, { type SetItem } from "../components/NilaNikanSetsSlider";
import { get, endpoints } from "@/lib/api";

const FALLBACK_IMG_PRODUCT = "/placeholder-product.png"; // داخل public بگذار
const FALLBACK_IMG_BUNDLE  = "/placeholder-bundle.png";  // داخل public بگذار

export default function Home() {
  const [products, setProducts] = useState<SetItem[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [bundles, setBundles] = useState<SetItem[]>([]);

  useEffect(() => {
    (async () => {
      const [prodData, bundleData] = await Promise.all([
        get(endpoints.products),
        get(`${endpoints.bundles}?active=true`),
      ]);

      const prodRaw   = Array.isArray(prodData)   ? prodData   : prodData?.results   ?? [];
      const bundleRaw = Array.isArray(bundleData) ? bundleData : bundleData?.results ?? [];

      // محصولات
      const normalizedProducts: SetItem[] = prodRaw.map((p: any) => ({
        id: p.id,
        name: p.title || p.name || `محصول ${p.id}`,
        image: p.image || p.thumbnail || p.images?.[0] || FALLBACK_IMG_PRODUCT,
        price: Number(p.final_price ?? p.discount_price ?? p.price ?? 0),
        href: `/product/${p.slug ?? p.id}`,
      }));
      setProducts(normalizedProducts);

      // شگفت‌انگیزها
      const mappedDeals: DealItem[] = prodRaw
        .map((p: any): DealItem => {
          const oldPrice = Number(p.price ?? 0);
          const price = Number(p.final_price ?? p.discount_price ?? oldPrice);
          return {
            id: p.id,
            name: p.title || p.name || `محصول ${p.id}`,
            image: p.image || p.thumbnail || p.images?.[0] || FALLBACK_IMG_PRODUCT,
            price,
            oldPrice,
            href: `/product/${p.slug ?? p.id}`,
          };
        })
        .filter(
          (d: DealItem): d is DealItem & { oldPrice: number; price: number } =>
            Number.isFinite(Number(d.oldPrice)) &&
            Number.isFinite(Number(d.price)) &&
            Number(d.oldPrice) > Number(d.price)
        );
      setDeals(mappedDeals);

      // باندل‌ها
      const normalizedBundles: SetItem[] = bundleRaw.map((b: any) => {
        const productImage =
          b?.products?.[0]?.image ||
          b?.items?.[0]?.product?.image ||
          b?.first_product?.image ||
          null;

        return {
          id: b.id,
          name: b.title || b.name || `باندل ${b.id}`,
          image: b.image || b.thumbnail || productImage || FALLBACK_IMG_BUNDLE,
          price: Number(b.final_price ?? b.bundle_price ?? b.discount_price ?? b.price ?? 0),
          // 👇 جمع شد
          href: `/bundles/${b.slug ?? b.id}`,
        };
      });
      setBundles(normalizedBundles);
    })().catch((e) => {
      console.error("home data load error:", e);
      setProducts([]); setDeals([]); setBundles([]);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800" dir="rtl">
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-12">
        <BannerSlider />
        <CustomerCarousel />

        {bundles.length > 0 && (
          <NilaNikanSetsSlider title="باندل‌ها" items={bundles} autoplay intervalMs={5000} />
        )}

        {deals.length > 0 && (
          <AmazingDealsSlider title="شگفت‌انگیزها" items={deals} countdownSeconds={0} />
        )}

        {products.length > 0 && (
          <NilaNikanSetsSlider title="محصولات" items={products} autoplay intervalMs={4500} />
        )}
      </main>
    </div>
  );
}
