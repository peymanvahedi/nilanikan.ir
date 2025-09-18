// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV, NavItem } from "@/lib/nav";

type Cat = { href?: string; label: string; icon?: React.ReactNode; children?: Cat[] };
type Raw = any;

const MENU_ENDPOINTS = ["/api/v1/menu", "/api/categories/menu/"];
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE || process.env.NEXT_PUBLIC_API_BASE || "";

// دادهٔ محلی NAV → ساختار داخلی منو
function navToCat(items: NavItem[] = []): Cat[] {
  const toCat = (n: NavItem): Cat => ({
    href: n.href,
    label: n.label,
    icon: undefined,
    children: n.children?.map(toCat),
  });
  return items.map(toCat);
}

// مسیر صفحهٔ محصول و دسته‌بندی را اینجا تنظیم کن
const PRODUCT_PREFIX = "/product";
const CATEGORY_PREFIX = "/category";

function toAbsUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${MEDIA_BASE}${u.startsWith("/") ? u : `/${u}`}`;
}

// تشخیص اینکه رکورد محصول است یا نه
function isProduct(raw: any) {
  return (
    raw?.type === "product" ||
    raw?.model === "product" ||
    raw?.kind === "product" ||
    raw?.is_product === true ||
    typeof raw?.price !== "undefined" ||
    typeof raw?.sku !== "undefined" ||
    typeof raw?.product_id !== "undefined"
  );
}

// ساخت لینک صحیح برای هر آیتم
function toHref(raw: Raw) {
  const direct = raw?.href ?? raw?.url ?? raw?.detail_url ?? raw?.link;
  if (direct) return direct.startsWith("/") ? direct : `/${direct}`;

  const slug =
    raw?.slug ??
    raw?.seo_slug ??
    raw?.path ??
    raw?.product_slug ??
    raw?.category_slug ??
    raw?.code;

  const id = raw?.id ?? raw?.product_id ?? raw?.pk;
  const tail = (slug ?? id ?? "").toString().replace(/^\/+/, "");

  if (isProduct(raw)) {
    return tail ? `${PRODUCT_PREFIX}/${tail}` : PRODUCT_PREFIX;
  }
  return tail ? `${CATEGORY_PREFIX}/${tail}` : CATEGORY_PREFIX;
}

function toLabel(raw: Raw) {
  return raw?.label ?? raw?.title ?? raw?.name ?? "";
}

function pickList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.children)) return data.children;
  return [];
}

type User = { fullName?: string; phone?: string } | null;

/* -------------------- دکمه‌های هدر: حساب و سبد -------------------- */
function initials(name?: string) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last || first).toUpperCase();
}

function AccountButton({ user }: { user: { fullName?: string } | null }) {
  const label = user?.fullName ? initials(user.fullName) : null;
  return (
    <Link
      href="/account"
      className="relative w-10 h-10 grid place-items-center rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-sm hover:shadow-md transition"
      title={user?.fullName ? `حساب کاربری: ${user.fullName}` : "حساب کاربری"}
    >
      {label ? (
        <span className="font-bold">{label}</span>
      ) : (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.69-8 6v.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V20c0-3.31-3.58-6-8-6Z"/>
        </svg>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/40" />
    </Link>
  );
}

function CartButton({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="relative w-10 h-10 grid place-items-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition"
      title="سبد خرید"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
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
      {count > 0 && (
        <span
          data-testid="cart-count"
          className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 text-white text-[11px] font-extrabold grid place-items-center shadow-sm"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

export default function Header() {
  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<User>(null);
  const [showCat, setShowCat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const pathname = usePathname();
  const searchWrapRefDesk = useRef<HTMLFormElement | null>(null);
  const searchWrapRefMob = useRef<HTMLFormElement | null>(null);

  // واکشی دسته‌بندی‌ها
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
              icon: raw?.icon?.url ? (
                <Image
                  src={toAbsUrl(raw.icon.url)}
                  width={20}
                  height={20}
                  alt=""
                  className="w-5 h-5 object-contain inline-block align-[-2px]"
                  unoptimized
                />
              ) : undefined,
              // اگر API شما children دارد می‌توانید اینجا map کنید
              // children: Array.isArray(raw.children) ? raw.children.map(...) : undefined,
            }))
            .filter((x) => x.label && (x.href || true));

          if (mapped.length && mounted) {
            setCategories(mapped);
            return; // از اولین منبع معتبر استفاده می‌کنیم
          }
        } catch {}
      }

      // Fallback: اگر از API چیزی نگرفتیم از NAV محلی استفاده کن
      if (mounted) {
        const mapped = navToCat(NAV);
        if (mapped.length) setCategories(mapped);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // مدیریت سبد خرید
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

  // مدیریت کاربر
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

  // ارسال جستجو سنتی
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  // جستجوی زنده با debounce + AbortController و فیلتر برند
  useEffect(() => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        // پیشنهاد: ساجست سبک
        const url = `/api/search/suggest?q=${encodeURIComponent(q)}`;
        // اگر جستجوی کامل می‌خواهی:
        // const url = `/api/search?q=${encodeURIComponent(q)}`;

        const res = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;

        const data = await res.json();
        const list = pickList(data);
        const filtered = Array.isArray(list) ? list.filter((item: any) => !item?.brand) : [];
        setSearchResults(filtered);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Search error:", err);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  // بستن دراپ‌داون با کلیک بیرون، اسکرول، ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchResults([]);
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !searchWrapRefDesk.current?.contains(target) &&
        !searchWrapRefMob.current?.contains(target)
      ) {
        setSearchResults([]);
      }
    };
    const onScroll = () => setSearchResults([]);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // تغییر مسیر
  useEffect(() => {
    setSearchResults([]);
    setQ("");
  }, [pathname]);

  const CartIcon = useMemo(
    () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    ),
    []
  );

  const SearchIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const MenuIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const CloseIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const renderSearchDropdown = () => (
    <div className="absolute left-0 right-0 top-full bg-white border border-zinc-300 rounded-b-xl mt-1 max-h-72 overflow-y-auto z-50 shadow-lg">
      {searchResults.map((item, idx) => {
        const img = item?.image?.url || item?.thumbnail?.url;
        const imgUrl = toAbsUrl(img || "");
        return (
          <Link
            key={idx}
            href={toHref(item)}
            onClick={() => {
              setShowSearch(false);
              setSearchResults([]);
            }}
            className="flex items-center gap-3 px-4 py-2 hover:bg-pink-50 transition rounded"
          >
            {imgUrl && (
              <Image src={imgUrl} alt={toLabel(item)} width={40} height={40} className="w-10 h-10 object-cover rounded" unoptimized />
            )}
            <span className="font-medium text-zinc-700">{toLabel(item)}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200" dir="rtl">
      <div className="bg-pink-600 text-white text-center text-xs sm:text-sm py-2">
        ارسال رایگان اولین خرید با کد <span className="font-extrabold bg-white/20 rounded px-2 mx-1">summer04</span>
      </div>

      {/* دسکتاپ */}
      <div className="hidden md:flex mx-auto max-w-6xl px-4 h-20 items-center justify-between gap-4">
        <Link href="/" className="text-3xl font-black text-pink-600 leading-none">
          نیلانیکان
        </Link>

        <form ref={searchWrapRefDesk} onSubmit={onSubmit} className="grow max-w-2xl w-full relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setTimeout(() => setSearchResults([]), 120)}
            placeholder="جست‌وجو..."
            className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-12 outline-none focus:ring-2 ring-pink-200"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
          {searchResults.length > 0 && renderSearchDropdown()}
        </form>

        {/* اکشن‌های سمت راست: سبد + حساب */}
        <div className="shrink-0 flex items-center gap-3">
          <CartButton count={cartCount} />
          <AccountButton user={user} />
        </div>
      </div>

      {/* منوی دسته‌بندی دسکتاپ */}
      {categories.length > 0 && (
        <div className="bg-zinc-900 text-white">
          <nav className="mx-auto max-w-6xl px-4 hidden md:block" data-testid="nav">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3 text-sm">
              {categories.map((c) => (
                <div key={c.label} className="relative group">
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="whitespace-nowrap hover:text-pink-400 transition inline-block py-2"
                      title={c.label}
                    >
                      {c.icon} {c.label}
                    </Link>
                  ) : (
                    <span className="whitespace-nowrap inline-block py-2">{c.label}</span>
                  )}

                  {c.children && c.children.length > 0 && (
                    <div className="absolute right-0 mt-2 hidden group-hover:block bg-white text-zinc-900 rounded-xl shadow-lg p-3 min-w-56 z-40">
                      <ul className="space-y-1">
                        {c.children.map((sub) => (
                          <li key={sub.label}>
                            {sub.href ? (
                              <Link href={sub.href} className="block px-3 py-2 rounded-lg hover:bg-zinc-100">
                                {sub.label}
                              </Link>
                            ) : (
                              <span className="block px-3 py-2 font-semibold">{sub.label}</span>
                            )}

                            {sub.children && sub.children.length > 0 && (
                              <ul className="mt-1 ps-3 border-s">
                                {sub.children.map((leaf) => (
                                  <li key={leaf.label}>
                                    <Link href={leaf.href || "#"} className="block px-3 py-2 rounded-lg hover:bg-zinc-100">
                                      {leaf.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* موبایل */}
      <div className="md:hidden mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <button onClick={() => setShowCat(true)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700">
          {MenuIcon}
        </button>
        <Link href="/" className="text-2xl font-black text-pink-600 leading-none">
          نیلانیکان
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch((s) => !s)} className="p-2 rounded-lg border border-zinc-300 text-zinc-700">
            {SearchIcon}
          </button>
          {/* سبد + حساب در موبایل */}
          <CartButton count={cartCount} />
          <AccountButton user={user} />
        </div>
      </div>

      {showSearch && (
        <form ref={searchWrapRefMob} onSubmit={onSubmit} className="md:hidden px-4 pb-3 relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجو..."
            className="w-full h-11 rounded-xl border border-zinc-300 pr-10 pl-4 outline-none focus:ring-2 ring-pink-200"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{SearchIcon}</span>
          {searchResults.length > 0 && renderSearchDropdown()}
        </form>
      )}

      {showCat && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCat(false)} />
          <div className="absolute inset-0 flex items-start justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <div className="flex items-center justify_between mb-3">
                <span className="font-bold">دسته‌بندی‌ها</span>
                <button onClick={() => setShowCat(false)} className="p-2">
                  {CloseIcon}
                </button>
              </div>

              {/* لینک‌های سریع (گرید) */}
              <div className="grid grid-cols-2 gap-3">
                {categories.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href || "#"}
                    onClick={() => setShowCat(false)}
                    className="rounded-xl border border-zinc-200 p-3 flex items-center gap-3 hover:border-pink-300 active:scale-[0.98] transition"
                  >
                    <span className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 grid place-items-center text-lg">{c.icon ?? "•"}</span>
                    <span className="text-sm font-semibold text-zinc-800">{c.label}</span>
                  </Link>
                ))}
              </div>

              {/* زیرمنوهای موبایل (تودرتو، باز/بسته‌شونده) */}
              <div className="mt-4">
                {categories.map((c) => (
                  <div key={c.label} className="mb-1">
                    {c.children && c.children.length > 0 ? (
                      <details className="group">
                        <summary className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                          <span>{c.label}</span>
                          <span className="text-xs opacity-70 group-open:rotate-180 transition">⌄</span>
                        </summary>
                        <div className="ps-4 py-1 space-y-1">
                          {c.children.map((sub) => (
                            <div key={sub.label}>
                              {sub.children && sub.children.length > 0 ? (
                                <details className="group">
                                  <summary className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                                    <span>{sub.label}</span>
                                    <span className="text-xs opacity-70 group-open:rotate-180 transition">⌄</span>
                                  </summary>
                                  <div className="ps-4 py-1 space-y-1">
                                    {sub.children.map((leaf) => (
                                      <Link
                                        key={leaf.label}
                                        href={leaf.href || "#"}
                                        onClick={() => setShowCat(false)}
                                        className="block px-3 py-2 rounded-lg hover:bg-zinc-50"
                                      >
                                        {leaf.label}
                                      </Link>
                                    ))}
                                  </div>
                                </details>
                              ) : (
                                <Link
                                  href={sub.href || "#"}
                                  onClick={() => setShowCat(false)}
                                  className="block px-3 py-2 rounded-lg hover:bg-zinc-50"
                                >
                                  {sub.label}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : (
                      <Link
                        href={c.href || "#"}
                        onClick={() => setShowCat(false)}
                        className="block px-3 py-2 rounded-lg hover:bg-zinc-50"
                      >
                        {c.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
