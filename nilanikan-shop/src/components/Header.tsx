// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Cat = { href: string; label: string; icon?: React.ReactNode };

const categories: Cat[] = [
  { href: "/offers",     label: "پیشنهاد ویژه",         icon: <span>⭐</span> },
  { href: "/brands",     label: "برندها",               icon: <span>🏷️</span> },
  { href: "/beauty",     label: "آرایشی",               icon: <span>💄</span> },
  { href: "/skin-care",  label: "مراقبت پوست",          icon: <span>🧴</span> },
  { href: "/hair-care",  label: "مراقبت و زیبایی مو",   icon: <span>💇‍♀️</span> },
  { href: "/personal",   label: "بهداشت شخصی",          icon: <span>🧼</span> },
  { href: "/perfume",    label: "عطر و اسپری",          icon: <span>🌸</span> },
  { href: "/electric",   label: "لوازم برقی",           icon: <span>🔌</span> },
  { href: "/sports",     label: "مکمل غذایی و ورزشی",   icon: <span>🏋️</span> },
  { href: "/fashion",    label: "مد و پوشاک",           icon: <span>👗</span> },
  { href: "/digital",    label: "کالای دیجیتال",        icon: <span>💻</span> },
  { href: "/mag",        label: "مجله خانومی",          icon: <span>📚</span> },
  { href: "/gold",       label: "طلا و نقره",           icon: <span>🪙</span> },
];

type User = { fullName?: string; phone?: string } | null;

export default function Header() {
  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<User>(null);
  const [showCat, setShowCat] = useState(false);     // پاپ‌آپ دسته‌ها (موبایل)
  const [showSearch, setShowSearch] = useState(false); // سرچ تاشو (موبایل)

  // شمارش سبد
  useEffect(() => {
    const addHandler = (e: Event) => {
      const any = e as CustomEvent<{ qty?: number }>;
      setCartCount((c) => c + (any.detail?.qty ?? 1));
    };
    const setHandler = (e: Event) => {
      const any = e as CustomEvent<{ count: number }>;
      setCartCount(any.detail.count);
    };
    window.addEventListener("cart:add", addHandler as EventListener);
    window.addEventListener("cart:set", setHandler as EventListener);
    return () => {
      window.removeEventListener("cart:add", addHandler as EventListener);
      window.removeEventListener("cart:set", setHandler as EventListener);
    };
  }, []);

  // وضعیت کاربر
  useEffect(() => {
    const readUser = () => {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };
    readUser();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (["user", "auth:ts"].includes(e.key)) readUser();
    };
    const onAuthChange = () => readUser();
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-change", onAuthChange as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-change", onAuthChange as any);
    };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  const CartIcon = useMemo(
    () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          d="M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 9 20h10v-2H10.42l.93-1.68h7.45a1 1 0 0 0 .92-.62l3-7A1 1 0 0 0 22 7H6.21l-.94-2H2V3h4l1.6 3H22"
          fill="currentColor"
        />
      </svg>
    ),
    []
  );

  const LoginIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M10 17l5-5-5-5v3H3v4h7v3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor" />
    </svg>
  );

  const UserIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5Z" fill="currentColor" />
    </svg>
  );

  const MenuIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const CloseIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const SearchIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200" dir="rtl">
      {/* نوار بالایی */}
      <div className="bg-pink-600 text-white text-center text-xs sm:text-sm py-2">
        ارسال رایگان اولین خرید با کد <span className="font-extrabold bg-white/20 rounded px-2 mx-1">summer04</span>
      </div>

      {/* دسکتاپ */}
      <div className="hidden md:flex mx-auto max-w-6xl px-4 h-20 items-center justify-between gap-4">
        <div className="shrink-0">
          <Link href="/" className="text-3xl font-black text-pink-600 leading-none">نیلانیکان</Link>
        </div>

        <form onSubmit={onSubmit} className="grow max-w-2xl w-full">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جست‌وجو..."
              className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-12 outline-none focus:ring-2 ring-pink-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
          </div>
        </form>

        <div className="shrink-0 flex items-center gap-4">
          {user ? (
            <Link href="/account" className="inline-flex items-center gap-2 h-10 px-6 rounded-xl border-2 border-pink-500 text-pink-600 font-bold hover:bg-pink-50">
              {UserIcon}
              حساب کاربری
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 h-10 px-6 rounded-xl border-2 border-pink-500 text-pink-600 font-bold hover:bg-pink-50">
              {LoginIcon}
              ورود
            </Link>
          )}

          <Link href="/cart" className="relative inline-flex items-center text-zinc-800 hover:text-pink-600">
            {CartIcon}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] rounded-full bg-pink-600 text-white text-[11px] font-bold grid place-items-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* موبایل: نوار بالا */}
      <div className="md:hidden mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={() => setShowCat(true)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700" aria-label="فهرست">
          {MenuIcon}
        </button>

        <Link href="/" className="text-2xl font-black text-pink-600 leading-none">نیلانیکان</Link>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowSearch((s) => !s)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700" aria-label="جست‌وجو">
            {SearchIcon}
          </button>

          <Link href="/cart" className="relative inline-flex items-center text-zinc-800 hover:text-pink-600" aria-label="سبد">
            {CartIcon}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] rounded-full bg-pink-600 text-white text-[11px] font-bold grid place-items-center px-1">
                {cartCount}
              </span>
            )}
          </Link>

          <Link href={user ? "/account" : "/login"} className="p-2 rounded-lg border border-zinc-300 text-zinc-700" aria-label={user ? "حساب کاربری" : "ورود"}>
            {user ? UserIcon : LoginIcon}
          </Link>
        </div>
      </div>

      {/* سرچ موبایل */}
      {showSearch && (
        <form onSubmit={onSubmit} className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جست‌وجو..."
              className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-4 outline-none focus:ring-2 ring-pink-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
          </div>
        </form>
      )}

      {/* نوار دسته‌بندی دسکتاپ */}
      <div className="bg-zinc-900 text-white">
        <nav className="mx-auto max-w-6xl px-4 hidden md:block">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3 text-sm">
            {categories.map((c) => (
              <Link key={c.href} href={c.href} className="whitespace-nowrap hover:text-pink-400 transition" title={c.label}>
                {c.icon} {c.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* پاپ‌آپ دسته‌بندی‌ها (موبایل) */}
      {showCat && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* پس‌زمینه */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCat(false)} />

          {/* جعبه وسط صفحه */}
          <div className="absolute inset-0 flex items-start justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">دسته‌بندی‌ها</span>
                <button onClick={() => setShowCat(false)} aria-label="بستن" className="p-2">
                  {CloseIcon}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={() => setShowCat(false)}
                    className="rounded-xl border border-zinc-200 p-3 flex items-center gap-3 hover:border-pink-300 active:scale-[0.98] transition"
                  >
                    <span className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 grid place-items-center text-lg">
                      {c.icon ?? "•"}
                    </span>
                    <span className="text-sm font-semibold text-zinc-800">{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
