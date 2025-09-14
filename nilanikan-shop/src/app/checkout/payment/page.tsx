// src/app/checkout/payment/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkout as startCheckout } from "@/lib/cart";

const SANDBOX_REDIRECT =
  process.env.NEXT_PUBLIC_SANDBOX_GATEWAY_URL ||
  "https://sandbox.zarinpal.com/pg/StartPay/TEST_AUTHORITY";

export default function PaymentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [ready, setReady] = useState(false);
  const didRun = useRef(false); // جلوگیری از اجرای تکراری روی رفرش/StrictMode

  const go = (url: string) => {
    // از replace استفاده نکن تا کاربر بتواند با back برگردد
    window.location.href = url;
  };

  const getRedirectFrom = (data: any): string | undefined => {
    if (!data || typeof data !== "object") return undefined;
    return (
      data.payment_url ||
      data.redirect_url ||
      data.url ||
      data.gateway_url ||
      undefined
    );
  };

  const start = async () => {
    const payloadRaw = sessionStorage.getItem("pendingCheckout");
    if (!payloadRaw) {
      router.replace("/cart");
      return;
    }

    setError(null);
    try {
      const payload = JSON.parse(payloadRaw);
      const res = await startCheckout(payload as any).catch(() => null);

      if (res?.ok) {
        const data = (res as any).data || {};
        const redirect = getRedirectFrom(data);

        if (redirect && typeof redirect === "string") {
          go(redirect);
          return;
        }
      }

      // اگر بک‌اند پاسخی نداد یا لینک نداشت، به سندباکس هدایت کن (قابل تنظیم با ENV)
      go(SANDBOX_REDIRECT);
    } catch (e: any) {
      // در صورت خطا هم به سندباکس می‌رویم؛ اما پیام خطا را نشان می‌دهیم
      setError(e?.message || "خطا در آغاز پرداخت");
      go(SANDBOX_REDIRECT);
    }
  };

  // تلاش خودکار در اولین ورود (یک‌بار)
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // کمی تأخیر تا sessionStorage مطمئن ست شده باشد (به‌خصوص پس از ناوبری)
    const t = setTimeout(() => {
      setReady(true);
      start();
    }, 100);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = async () => {
    setRetrying(true);
    await start();
    setRetrying(false);
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-10 text-center" dir="rtl">
      <h1 className="text-2xl font-bold mb-3">در حال آماده‌سازی پرداخت…</h1>
      <p className="text-zinc-600">
        {ready ? "در حال انتقال به درگاه پرداخت" : "لطفاً چند لحظه صبر کنید."}
      </p>

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
            <a
              href={SANDBOX_REDIRECT}
              className="rounded-lg border px-4 py-2"
            >
              رفتن به پرداخت تستی
            </a>
            <button
              onClick={() => router.replace("/cart")}
              className="rounded-lg border px-4 py-2"
            >
              بازگشت به سبد
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            می‌توانید مقدار <code>NEXT_PUBLIC_SANDBOX_GATEWAY_URL</code> را در
            ENV تنظیم کنید.
          </p>
        </div>
      )}
    </main>
  );
}
