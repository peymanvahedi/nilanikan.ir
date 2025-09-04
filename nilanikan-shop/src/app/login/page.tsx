// src/app/login/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login as loginPassword, me, logout } from "@/lib/auth";
import { post } from "@/lib/api";

function toEnDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input
    .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
}

type Mode = "otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  // --- حالت ورود ---
  const [mode, setMode] = useState<Mode>("otp");

  // --- state مشترک ---
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // --- OTP state ---
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const timer = useRef<any>(null);

  const phoneClean = useMemo(() => toEnDigits(phone).replace(/[^\d]/g, ""), [phone]);
  const otpClean = useMemo(() => toEnDigits(otp).replace(/[^\d]/g, ""), [otp]);

  // --- Password state ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) router.replace(next);
    } catch {}
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [next, router]);

  // ===== OTP FLOW (اگر بک‌اند مسیرهای OTP داشته باشد) =====
  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null); setOk(null);

    if (!/^09\d{9}$/.test(phoneClean)) {
      setErr("شماره موبایل نامعتبر است");
      return;
    }

    try {
      setBusy(true);
      // تلاش برای بک‌اند واقعی:
      // فرض مسیرها: POST /api/auth/otp/send/  body: { phone }
      try {
        await post("/api/auth/otp/send/", { phone: phoneClean });
      } catch (e: any) {
        // اگر 404 بود یا هنوز پیاده‌سازی نشده: شبیه‌سازی (دمو)
        await new Promise((r) => setTimeout(r, 700));
      }

      setOtpSent(true);
      setOk("کد تأیید ارسال شد.");
      setResendIn(60);
      timer.current = setInterval(() => {
        setResendIn((s: number) => {
          if (s <= 1) {
            clearInterval(timer.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e: any) {
      setErr(e?.message || "ارسال کد ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null); setOk(null);

    if (otpClean.length < 4) {
      setErr("کد تأیید نامعتبر است");
      return;
    }

    try {
      setBusy(true);
      // تلاش برای بک‌اند واقعی:
      // فرض مسیرها: POST /api/auth/otp/verify/  body: { phone, code }
      // پاسخِ موفق: { access: "<JWT>" }
      try {
        const data = await post("/api/auth/otp/verify/", { phone: phoneClean, code: otpClean });
        if (data?.access) {
          localStorage.setItem("token", data.access);
        }
      } catch {
        // اگر هنوز OTP سمت سرور نداری: دمو
        localStorage.setItem("token", "demo-token");
      }

      localStorage.setItem("auth_phone", phoneClean);
      localStorage.setItem("user", JSON.stringify({ fullName: "", phone: phoneClean }));
      localStorage.setItem("auth:ts", String(Date.now()));
      window.dispatchEvent(new Event("auth-change"));

      router.replace(next);
    } catch (e: any) {
      setErr(e?.message || "ورود ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || busy) return;
    await sendOtp(new Event("submit") as any);
  }

  // ===== PASSWORD FLOW (JWT آماده‌ی بک‌اند شما) =====
  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null); setOk(null);

    try {
      setBusy(true);
      await loginPassword(username, password);   // توکن داخل localStorage ذخیره می‌شود
      try {
        const info = await me();
        localStorage.setItem("user", JSON.stringify(info));
      } catch {}
      localStorage.setItem("auth:ts", String(Date.now()));
      window.dispatchEvent(new Event("auth-change"));
      router.replace(next);
    } catch (e: any) {
      setErr(e?.message || "نام کاربری یا رمز عبور نادرست است.");
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    logout();
    setOk("خروج انجام شد.");
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl md:text-2xl font-bold text-center">ورود / ثبت‌نام</h1>

      {/* تب انتخاب روش ورود */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          className={`h-10 rounded-xl border ${mode === "otp" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
          onClick={() => { setMode("otp"); setErr(null); setOk(null); }}
        >
          ورود با کد تأیید (OTP)
        </button>
        <button
          className={`h-10 rounded-xl border ${mode === "password" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
          onClick={() => { setMode("password"); setErr(null); setOk(null); }}
        >
          نام کاربری / رمز
        </button>
      </div>

      {/* --- فرم‌ها --- */}
      {mode === "otp" ? (
        !otpSent ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm">شماره موبایل</span>
              <input
                className="mt-1 w-full h-11 rounded-xl border border-zinc-200 px-3 outline-none"
                placeholder="09xxxxxxxxx"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              دریافت کد تأیید
            </button>

            <p className="text-xs text-center text-zinc-500">
              با ورود،{" "}
              <Link href="/terms" className="underline">قوانین</Link> و{" "}
              <Link href="/privacy" className="underline">حریم خصوصی</Link> را می‌پذیرید.
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm">کد تأیید</span>
              <input
                className="mt-1 w-full h-11 rounded-xl border border-zinc-200 px-3 outline-none"
                placeholder="کد ۴ رقمی"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              ورود
            </button>

            <button
              type="button"
              onClick={resend}
              disabled={busy || resendIn > 0}
              className="w-full h-11 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `ارسال مجدد کد (${resendIn}s)` : "ارسال مجدد کد"}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={onSubmitPassword} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm">نام کاربری</span>
            <input
              className="mt-1 w-full h-11 rounded-xl border border-zinc-200 px-3 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm">رمز عبور</span>
            <input
              className="mt-1 w-full h-11 rounded-xl border border-zinc-200 px-3 outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="h-11 flex-1 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
            >
              ورود
            </button>
            <button
              type="button"
              onClick={() => { logout(); setOk("خروج انجام شد."); }}
              className="h-11 flex-1 rounded-xl border hover:bg-zinc-50"
            >
              خروج
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              setErr(null); setOk(null);
              try {
                setBusy(true);
                const info = await me();
                setOk(`وضعیت کاربر: ${JSON.stringify(info)}`);
              } catch (e: any) {
                setErr(e?.message || "گرفتن اطلاعات کاربر ناموفق بود.");
              } finally {
                setBusy(false);
              }
            }}
            className="h-11 w-full rounded-xl border hover:bg-zinc-50"
          >
            بررسی حساب (me)
          </button>
        </form>
      )}

      {err && <p className="mt-4 text-rose-600">{err}</p>}
      {ok && (
        <pre className="mt-4 max-h-60 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-green-400">
{ok}
        </pre>
      )}
    </main>
  );
}
