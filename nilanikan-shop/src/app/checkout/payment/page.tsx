// src/app/checkout/payment/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkout as startCheckout } from "@/lib/cart";

export default function PaymentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // تلاش خودکار در اولین ورود
  useEffect(() => {
    const payloadRaw = sessionStorage.getItem("pendingCheckout");
    if (!payloadRaw) {
      router.replace("/cart");
      return;
    }
    (async () => {
      try {
        const payload = JSON.parse(payloadRaw);
        const res = await startCheckout(payload as any).catch(() => null);

        if (res?.ok) {
          const data = (res as any).data || {};
          const redirect: string | undefined =
            data.payment_url || data.redirect_url || data.url || data.gateway_url;

          if (redirect) {
            window.location.href = redirect;
            return;
          }
        }
        // اگر لینک نگرفتیم، بگذار کاربر دستی دوباره تلاش کند
        setError("لینک پرداخت دریافت نشد. دوباره تلاش کنید.");
      } catch (e: any) {
        setError(e?.message || "خطا در آغاز پرداخت");
      }
    })();
  }, [router]);

  const retry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const payloadRaw = sessionStorage.getItem("pendingCheckout");
      if (!payloadRaw) {
        router.replace("/cart");
        return;
      }
      const payload = JSON.parse(payloadRaw);
      const res = await startCheckout(payload as any).catch(() => null);
      if (res?.ok) {
        const data = (res as any).data || {};
        const redirect: string | undefined =
          data.payment_url || data.redirect_url || data.url || data.gateway_url;

        if (redirect) {
          window.location.href = redirect;
          return;
        }
      }
      setError("باز هم نتوانستیم لینک پرداخت بگیریم.");
    } catch (e: any) {
      setError(e?.message || "خطا در تلاش مجدد پرداخت");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-10 text-center" dir="rtl">
      <h1 className="text-2xl font-bold mb-3">در حال آماده‌سازی پرداخت…</h1>
      <p className="text-zinc-600">لطفاً چند لحظه صبر کنید.</p>

      {error && (
        <div className="mt-5 space-y-3">
          <p className="text-rose-600 text-sm">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={retry}
              disabled={retrying}
              className="rounded-lg bg-pink-600 text-white px-4 py-2 disabled:opacity-50"
            >
              {retrying ? "در حال تلاش..." : "تلاش مجدد پرداخت"}
            </button>
            <button
              onClick={() => router.replace("/cart")}
              className="rounded-lg border px-4 py-2"
            >
              بازگشت به سبد
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
