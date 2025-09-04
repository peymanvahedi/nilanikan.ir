// src/app/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { post, endpoints } from "@/lib/api";

type User = { fullName: string; phone: string };
type ShippingMethod = "post" | "mahex";

// Helpers
const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const toFa = (n: number) => Number(n || 0).toLocaleString("fa-IR");
const validPhone = (p: string) => /^09\d{9}$/.test(String(p).replace(/[^\d]/g, ""));
const validPostal = (p: string) => /^\d{10}$/.test(String(p).replace(/[^\d]/g, ""));

function lineTitle(it: { kind: "product" | "bundle"; name?: string; title?: string }) {
  return it.kind === "bundle" ? String(it.title ?? it.name ?? "باندل") : String(it.name ?? "محصول");
}
function lineTotal(it: { price: number; qty: number }) {
  return Number(it.price || 0) * Number(it.qty || 1);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total } = useCart();

  // جلوگیری از Hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shipping, setShipping] = useState<ShippingMethod>("post");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // احراز هویت ساده از localStorage (فقط برای پرکردن فرم/ریدایرکت)
  useEffect(() => {
    const goLogin = () => {
      const current =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/checkout";
      router.replace(`/login?next=${encodeURIComponent(current)}`);
    };
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!raw) return goLogin();
      const u = JSON.parse(raw) as User;
      setFullName(u.fullName || "");
      setPhone(u.phone || "");
    } catch {
      goLogin();
    }
  }, [router]);

  // اگر سبد خالی بود -> برگشت به /cart
  useEffect(() => {
    if (!items || items.length === 0) router.replace("/cart");
  }, [items, router]);

  const shippingCost = useMemo(() => (shipping === "post" ? 35000 : 55000), [shipping]);

  const itemsSubtotal = useMemo(() => {
    if (Number.isFinite(total) && (total as number) >= 0) return total as number;
    return (Array.isArray(items) ? items : []).reduce((s, it: any) => s + lineTotal(it), 0);
  }, [items, total]);

  const grandTotal = useMemo(
    () => itemsSubtotal + ((Array.isArray(items) ? items.length : 0) > 0 ? shippingCost : 0),
    [itemsSubtotal, items, shippingCost]
  );

  const disabled = useMemo(
    () =>
      !(Array.isArray(items) && items.length) ||
      !fullName.trim() ||
      !validPhone(phone) ||
      !address.trim() ||
      !validPostal(postalCode) ||
      submitting,
    [items, fullName, phone, address, postalCode, submitting]
  );

  const payAndCreateOrder = async () => {
    if (disabled) return;
    try {
      setSubmitting(true);
      setError("");

      // Payload استاندارد سمت سرور
      const serverPayload = {
        customer_name: fullName,
        customer_phone: phone,
        address,
        postal_code: postalCode,
        shipping_method: shipping,
        shipping_cost: shippingCost,
        items: (Array.isArray(items) ? items : []).map((it: any) => ({
          product_id: it.id,
          quantity: it.qty ?? it.quantity ?? 1,
          price: it.price ?? 0,
          name: it.name ?? it.title ?? `#${it.id}`,
          image: it.image ?? null,
          kind: it.kind ?? "product",
        })),
        items_subtotal: itemsSubtotal,
        total: grandTotal,
      };

      // ارسال با احراز هویت (Bearer) – api.ts خودش refresh می‌کند
      const data: any = await post(endpoints.checkout, serverPayload, {
        auth: true,
        throwOnHTTP: true,
      });

      // مسیر بازگشت/درگاه
      const redirect: string | undefined =
        data?.payment_url || data?.redirect_url || data?.url || data?.gateway_url;

      if (redirect && typeof redirect === "string") {
        window.location.href = redirect;
        return;
      }

      // اگر لینک نداد، به صفحه موفقیت/پرداخت داخلی برو
      try {
        sessionStorage.setItem("pendingCheckout", JSON.stringify(serverPayload));
      } catch {}
      // اولویت با id سفارش، در غیر اینصورت صفحهٔ موفق
      if (data?.order_id || data?.id) {
        router.push(`/orders/${encodeURIComponent(String(data.order_id ?? data.id))}`);
      } else {
        router.push("/checkout/success");
      }
    } catch (e: any) {
      setError(e?.message || "خطا در ثبت سفارش/پرداخت");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
        <h1 className="text-xl md:text-2xl font-bold mb-6">تسویه حساب</h1>
        <p className="text-zinc-600">در حال آماده‌سازی…</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-xl md:text-2xl font-bold mb-6">تسویه حساب</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* اطلاعات گیرنده و ارسال */}
        <section className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 bg-white">
            <h2 className="font-semibold mb-4">اطلاعات گیرنده</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm">نام و نام خانوادگی</span>
                <input
                  className="mt-1 w-full h-11 rounded-lg border border-zinc-200 px-3 outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثلاً: نیلا نیکان"
                />
              </label>

              <label className="block">
                <span className="text-sm">شماره موبایل</span>
                <input
                  className="mt-1 w-full h-11 rounded-lg border border-zinc-200 px-3 outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  inputMode="tel"
                />
                {!validPhone(phone) && phone && (
                  <span className="text-xs text-rose-600">شماره موبایل را ۱۱ رقمی وارد کنید (09123456789)</span>
                )}
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-sm">آدرس کامل</span>
              <textarea
                className="mt-1 w-full min-h-[96px] rounded-lg border border-zinc-200 px-3 py-2 outline-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="استان، شهر، محله، خیابان، کوچه، پلاک، واحد"
              />
            </label>

            <label className="block mt-4 max-w-xs">
              <span className="text-sm">کد پستی (۱۰ رقمی)</span>
              <input
                className="mt-1 w-full h-11 rounded-lg border border-zinc-200 px-3 outline-none"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="XXXXXXXXXX"
                inputMode="numeric"
                maxLength={10}
              />
              {!validPostal(postalCode) && postalCode && (
                <span className="text-xs text-rose-600">کد پستی باید ۱۰ رقم باشد.</span>
              )}
            </label>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-white">
            <h2 className="font-semibold mb-4">روش ارسال</h2>

            <div className="flex gap-3">
              <button
                type="button"
                className={`h-10 px-4 rounded-lg border ${
                  shipping === "post" ? "border-pink-600 text-pink-600" : "border-zinc-200"
                }`}
                onClick={() => setShipping("post")}
              >
                پست ({toFa(35000)})
              </button>
              <button
                type="button"
                className={`h-10 px-4 rounded-lg border ${
                  shipping === "mahex" ? "border-pink-600 text-pink-600" : "border-zinc-200"
                }`}
                onClick={() => setShipping("mahex")}
              >
                ماهکس ({toFa(55000)})
              </button>
            </div>
          </div>
        </section>

        {/* خلاصه سفارش */}
        <aside className="lg:col-span-1 p-4 rounded-xl border border-zinc-200 bg-white h-fit">
          <h2 className="font-semibold mb-4">خلاصه سفارش</h2>

          <ul className="space-y-2 text-sm" suppressHydrationWarning>
            {(Array.isArray(items) ? items : []).map((it: any, idx: number) => (
              <li
                key={`${it?.kind ?? "product"}-${it?.id}-${idx}`}
                className="flex justify-between"
              >
                <span className="truncate max-w-[60%]">
                  {lineTitle(it)}
                  {it?.qty > 1 ? ` × ${it.qty}` : ""}
                </span>
                <span className="text-pink-600 font-semibold">
                  {nf.format(lineTotal({ price: it?.price ?? 0, qty: it?.qty ?? 1 }))} تومان
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between text-sm">
            <span>هزینه ارسال</span>
            <span>{(Array.isArray(items) && items.length) ? nf.format(shippingCost) : 0} تومان</span>
          </div>

          <div className="mt-3 flex justify-between font-semibold">
            <span>مبلغ نهایی</span>
            <span>{nf.format(grandTotal)} تومان</span>
          </div>

          {error && <div className="text-xs text-rose-600 mt-2 whitespace-pre-wrap break-words">{error}</div>}

          <button
            onClick={payAndCreateOrder}
            disabled={disabled}
            className="w-full mt-4 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
          >
            {submitting ? "در حال انتقال به پرداخت..." : "ثبت و پرداخت"}
          </button>
        </aside>
      </div>
    </main>
  );
}
