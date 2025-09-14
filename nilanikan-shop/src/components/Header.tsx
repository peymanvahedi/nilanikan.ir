"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTour } from "@/components/tour/TourProvider";

type Cat = { href: string; label: string; icon?: React.ReactNode };
type Raw = any;

const MENU_ENDPOINTS = ["/api/v1/menu", "/api/categories/menu/"];

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

function toAbsUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${MEDIA_BASE}${u.startsWith("/") ? u : `/${u}`}`;
}

function toHref(raw: Raw) {
  const slug = raw?.slug ?? raw?.seo_slug ?? raw?.path;
  const href = raw?.href ?? raw?.url;
  if (href) return href.startsWith("/") ? href : `/${href}`;
  if (!slug) return "/";
  return slug.startsWith("/") ? slug : `/category/${slug}`;
}
function toLabel(raw: Raw) {
  return raw?.label ?? raw?.title ?? raw?.name ?? "";
}
function toIcon(raw: any): React.ReactNode | undefined {
  const ico =
    raw?.icon?.url ?? raw?.icon_url ?? raw?.icon ??
    raw?.image?.url ?? raw?.image_url ?? raw?.image;
  if (!ico) return undefined;
  const url = toAbsUrl(ico);
  if (!url) return undefined;
  return (
    <Image
      src={url}
      alt=""
      width={20}
      height={20}
      className="w-5 h-5 object-contain inline-block align-[-2px]"
      unoptimized
    />
  );
}
function pickList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.children)) return data.children;
  return [];
}

type User = { fullName?: string; phone?: string } | null;

export default function Header() {
  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<User>(null);
  const [showCat, setShowCat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState<Cat[]>([]);

  const { start } = useTour();

  useEffect(() => {
    let mounted = true;
    (async () => {
      for (const url of MENU_ENDPOINTS) {
        try {
          const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "force-cache" });
          if (!res.ok) continue;
          const data = await res.json();
          const list = pickList(data);
          if (!Array.isArray(list) || list.length === 0) continue;
          const mapped: Cat[] = list
            .map((raw) => ({
              href: toHref(raw),
              label: toLabel(raw),
              icon: toIcon(raw),
            }))
            .filter((x) => x.label && x.href);
          if (mapped.length && mounted) setCategories(mapped);
          break;
        } catch {}
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  useEffect(() => {
    const readUser = () => {
      try { const raw = localStorage.getItem("user"); setUser(raw ? JSON.parse(raw) : null); }
      catch { setUser(null); }
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

  const CartIcon = useMemo(() => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3h2l1.6 9.59A2 2 0 0 0 8.5 15H19a1 1 0 0 0 .95-.68l1.5-5A1 1 0 0 0 20.5 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10" cy="20" r="1" fill="currentColor"/>
      <circle cx="18" cy="20" r="1" fill="currentColor"/>
    </svg>
  ), []);

  const LoginIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 17l5-5-5-5v3H3v4h7v3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor"/>
    </svg>
  );
  const UserIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5Z" fill="currentColor"/>
    </svg>
  );
  const MenuIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  const CloseIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  const SearchIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200" dir="rtl">
      <div className="bg-pink-600 text-white text-center text-xs sm:text-sm py-2">
        ارسال رایگان اولین خرید با کد <span className="font-extrabold bg-white/20 rounded px-2 mx-1">summer04</span>
      </div>

      {/* دسکتاپ */}
      <div className="hidden md:flex mx-auto max-w-6xl px-4 h-20 items-center justify-between gap-4">
        <div className="shrink-0 flex items-center gap-2">
          <Link href="/" className="text-3xl font-black text-pink-600 leading-none">نیلانیکان</Link>
          <button onClick={() => start()} className="help-btn hidden lg:inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50" aria-label="نمایش آموزش">❓ راهنما</button>
        </div>

        <form onSubmit={onSubmit} className="grow max-w-2xl w-full">
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو..." className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-12 outline-none focus:ring-2 ring-pink-200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
          </div>
        </form>

        <div className="shrink-0 flex items-center gap-4">
          {user ? (
            <Link href="/account" className="inline-flex items-center gap-2 h-10 px-6 rounded-xl border-2 border-pink-500 text-pink-600 font-bold hover:bg-pink-50">
              {UserIcon} حساب کاربری
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 h-10 px-6 rounded-xl border-2 border-pink-500 text-pink-600 font-bold hover:bg-pink-50">
              {LoginIcon} ورود
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
      <div className="md:hidden mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <button onClick={() => setShowCat(true)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700" aria-label="فهرست">
          {MenuIcon}
        </button>
        <Link href="/" className="text-2xl font-black text-pink-600 leading-none">نیلانیکان</Link>
        <div className="flex items-center gap-2">
          <button onClick={() => start()} className="p-2 rounded-lg border border-zinc-300 text-zinc-700" aria-label="راهنما">❓</button>
          <button onClick={() => setShowSearch((s) => !s)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700" aria-label="جست‌وجو">{SearchIcon}</button>
          <Link href="/cart" className="relative inline-flex items-center text-zinc-800 hover:text-pink-600" aria-label="سبد">{CartIcon}
            {cartCount > 0 && (<span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] rounded-full bg-pink-600 text-white text-[11px] font-bold grid place-items-center px-1">{cartCount}</span>)}
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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو..." className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-4 outline-none focus:ring-2 ring-pink-200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
          </div>
        </form>
      )}

      {/* نوار دسته‌بندی دسکتاپ */}
      {categories.length > 0 && (
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
      )}

      {/* پاپ‌آپ دسته‌بندی‌ها (موبایل) */}
      {showCat && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCat(false)} />
          <div className="absolute inset-0 flex items-start justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">دسته‌بندی‌ها</span>
                <button onClick={() => setShowCat(false)} aria-label="بستن" className="p-2">{CloseIcon}</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((c) => (
                  <Link key={c.href} href={c.href} onClick={() => setShowCat(false)} className="rounded-xl border border-zinc-200 p-3 flex items-center gap-3 hover:border-pink-300 active:scale-[0.98] transition">
                    <span className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 grid place-items-center text-lg">{c.icon ?? "•"}</span>
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
