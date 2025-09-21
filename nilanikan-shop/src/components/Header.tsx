// app/components/Header.tsx (یا مسیر فعلی Header.tsx)
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAV, NavItem } from "@/lib/nav";
import * as Lucide from "lucide-react";

// آیکن بر اساس نام داخل NAV (مثل "Shirt", "Percent", "Info")
function IconOf(name?: string, cls = "w-7 h-7") {
  if (!name) return null;
  const Cmp = (Lucide as any)[name];
  return Cmp ? <Cmp className={cls} /> : null;
}

type Cat = { href?: string; label: string; icon?: string };

// آیتم‌هایی که نباید در منوی موبایل باشند
const EXCLUDE_FROM_MOBILE_MENU = new Set(["تخفیف‌ها", "پوشاک کودک", "درباره ما"]);

// اگر بعد از فیلتر چیزی نماند، زیرآیتم‌های والدها را به صورت دسته‌ی اصلی برمی‌گردانیم
function flattenChildrenAsMain(items: NavItem[]): Cat[] {
  const out: Cat[] = [];
  for (const n of items) {
    if (n.children && n.children.length > 0) {
      for (const ch of n.children) {
        out.push({ href: ch.href, label: ch.label, icon: n.icon }); // آیکن از والد
      }
    }
  }
  return out;
}

export default function Header() {
  const [q, setQ] = useState("");
  const [showCat, setShowCat] = useState(false);
  const [categories, setCategories] = useState<Cat[]>([]);
  const searchWrapRefDesk = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    // 1) آیتم‌های تاپ‌لِول غیرحذفی
    const topLevel: Cat[] = NAV
      .map((n) => ({ href: n.href, label: n.label, icon: n.icon }))
      .filter((c) => !EXCLUDE_FROM_MOBILE_MENU.has(c.label));

    if (topLevel.length > 0) {
      setCategories(topLevel);
      return;
    }

    // 2) اگر چیزی نماند، زیرآیتم‌ها را به عنوان دسته اصلی نشان بده
    const flattened = flattenChildrenAsMain(NAV);
    setCategories(flattened);
  }, []);

  const SearchIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
  const MenuIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  const CloseIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  function CartButton() {
    return (
      <Link
        href="/cart"
        className="relative w-10 h-10 grid place-items-center rounded-full border border-zinc-300 text-zinc-700"
        title="سبد خرید"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
          <path
            d="M3 3h2l1.6 9.59A2 2 0 0 0 8.5 15H19a1 1 0 0 0 .95-.68l1.5-5A1 1 0 0 0 20.5 8H7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1" fill="currentColor" />
          <circle cx="18" cy="20" r="1" fill="currentColor" />
        </svg>
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200" dir="rtl">
      {/* نوار بالایی */}
      <div className="bg-pink-600 text-white text-center text-xs sm:text-sm py-2">
        ارسال رایگان اولین خرید با کد <span className="font-extrabold bg-white/20 rounded px-2 mx-1">summer04</span>
      </div>

      {/* هدر دسکتاپ */}
      <div className="hidden md:flex mx-auto max-w-6xl px-4 h-20 items-center justify-between gap-4">
        <Link href="/" className="text-3xl font-black text-pink-600">نیلانیکان</Link>
        <form ref={searchWrapRefDesk} className="grow max-w-2xl w-full relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجو..."
            className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-12 outline-none focus:ring-2 ring-pink-200"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
        </form>
        <CartButton />
      </div>

      {/* هدر موبایل */}
      <div className="md:hidden mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <button onClick={() => setShowCat(true)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700">
          {MenuIcon}
        </button>
        <Link href="/" className="text-2xl font-black text-pink-600">نیلانیکان</Link>
        <CartButton />
      </div>

      {/* پاپ‌آپ منوی اصلی موبایل (بدون زیرمنو) */}
      {showCat && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCat(false)} />
          <div className="absolute inset-0 flex items-start justify-center p-4">
            <div
              className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto ring-1 ring-zinc-200"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <span className="font-extrabold text-lg text-pink-600">دسته‌بندی‌ها</span>
                <button onClick={() => setShowCat(false)} className="p-2 rounded-full hover:bg-pink-100 transition-colors">
                  {CloseIcon}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.length === 0 && (
                  <p className="col-span-2 text-center text-zinc-500 text-sm">موردی برای نمایش نیست</p>
                )}

                {categories.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href || "#"}
                    onClick={() => setShowCat(false)}
                    className="group rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50
                               p-4 flex flex-col items-center justify-center gap-2
                               shadow-sm hover:shadow-md hover:from-pink-50 hover:to-white
                               transition-all duration-200 text-sm font-semibold text-zinc-800"
                  >
                    <span className="text-pink-600 group-hover:scale-110 transition-transform">
                      {IconOf(c.icon)}
                    </span>
                    <span className="text-center">{c.label}</span>
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
