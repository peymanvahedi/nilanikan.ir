// src/app/login/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api"; // ✅ استفاده از API_BASE مرکزی

type Mode = "password" | "otp";

function ActualLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"enter" | "verify">("enter");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const faPhone = useMemo(
    () => String(phone || "").replace(/[^\d]/g, ""),
    [phone]
  );

  // اگر قبلاً لاگین است، ریدایرکت شو
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) router.replace(next);
    } catch {}
  }, [next, router]);

  const validPhone = (p: string) => /^09\d{9}$/.test(p);

  const finishLogin = (user: { fullName?: string; phone: string }) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth:ts", String(Date.now()));
    window.dispatchEvent(new Event("auth-change"));
    router.replace(next);
  };

  // ورود با رمز عبور — نسخه واقعی با بک‌اند
  const loginWithPassword = async () => {
    setErr("");
    if (!validPhone(faPhone)) return setErr("شماره موبایل معتبر نیست.");
    if (!password.trim()) return setErr("رمز عبور را وارد کنید.");
    try {
      setBusy(true);
      // نسخه واقعی:
      // const res = await fetch(`${API_BASE}/api/auth/login/`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({ phone: faPhone, password }),
      // });
      // if (!res.ok) throw new Error("ورود ناموفق بود");
      // const u = await res.json();
      // finishLogin({ fullName: u?.full_name, phone: u?.phone || faPhone });

      // نسخه دموی بدون بک‌اند:
      await new Promise((r) => setTimeout(r, 500));
      finishLogin({ fullName: "کاربر", phone: faPhone });
    } catch (e: any) {
      setErr(e?.message || "ورود ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  // درخواست کد OTP
  const requestOtp = async () => {
    setErr("");
    if (!validPhone(faPhone)) return setErr("شماره موبایل معتبر نیست.");
    try {
      setBusy(true);
      // نسخه واقعی:
      // await fetch(`${API_BASE}/api/auth/otp/request/`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ phone: faPhone }),
      // });
      await new Promise((r) => setTimeout(r, 500));
      setStep("verify");
    } catch {
      setErr("ارسال کد ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  // تایید کد OTP
  const verifyOtp = async () => {
    setErr("");
    if (!otp.trim()) return setErr("کد تایید را وارد کنید.");
    try {
      setBusy(true);
      // نسخه واقعی:
      // const res = await fetch(`${API_BASE}/api/auth/otp/verify/`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ phone: faPhone, code: otp }),
      // });
      // if (!res.ok) throw new Error("کد نامعتبر است");
      await new Promise((r) => setTimeout(r, 500));
      finishLogin({ fullName: "کاربر", phone: faPhone });
    } catch (e: any) {
      setErr(e?.message || "کد نامعتبر است");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-bold mb-6 text-zinc-800">ورود به حساب</h1>

      {/* انتخاب روش ورود */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setMode("password");
            setStep("enter");
            setErr("");
          }}
          className={`h-10 rounded-xl border ${
            mode === "password"
              ? "bg-pink-600 text-white border-pink-600"
              : "border-zinc-200"
          }`}
        >
          ورود با رمز
        </button>
        <button
          onClick={() => {
            setMode("otp");
            setStep("enter");
            setErr("");
          }}
          className={`h-10 rounded-xl border ${
            mode === "otp"
              ? "bg-pink-600 text-white border-pink-600"
              : "border-zinc-200"
          }`}
        >
          ورود با کد تایید
        </button>
      </div>

      {/* فرم‌ها */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-zinc-700">شماره موبایل</label>
          <input
            inputMode="numeric"
            dir="ltr"
            placeholder="09xxxxxxxxx"
            className="mt-1 w-full h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-pink-400"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {mode === "password" && (
          <div>
            <label className="text-sm text-zinc-700">رمز عبور</label>
            <input
              type="password"
              className="mt-1 w-full h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-pink-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {mode === "otp" && step === "verify" && (
          <div>
            <label className="text-sm text-zinc-700">کد تایید</label>
            <input
              inputMode="numeric"
              dir="ltr"
              placeholder="123456"
              className="mt-1 w-full h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-pink-400"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
        )}

        {err && <div className="text-rose-600 text-sm">{err}</div>}

        {mode === "password" ? (
          <button
            onClick={loginWithPassword}
            disabled={busy}
            className="w-full h-11 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {busy ? "در حال ورود..." : "ورود"}
          </button>
        ) : step === "enter" ? (
          <button
            onClick={requestOtp}
            disabled={busy}
            className="w-full h-11 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {busy ? "در حال ارسال کد..." : "ارسال کد تایید"}
          </button>
        ) : (
          <button
            onClick={verifyOtp}
            disabled={busy}
            className="w-full h-11 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {busy ? "در حال تایید..." : "تایید و ورود"}
          </button>
        )}
      </div>

      {/* لینک جایگزین */}
      <p className="text-xs text-zinc-500 mt-4">
        پس از ورود، به{" "}
        <span className="font-semibold text-zinc-700">{next}</span> منتقل می‌شوید.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">در حال بارگذاری…</div>}>
      <ActualLoginPage />
    </Suspense>
  );
}
