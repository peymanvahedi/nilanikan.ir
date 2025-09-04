// src/components/HeaderUserButton.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { fullName?: string; phone?: string } | null;

export default function HeaderUserButton() {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };
    read();

    // واکنش به تغییرات ورود/خروج در همان تب یا تب‌های دیگر
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (["user", "auth:ts"].includes(e.key)) read();
    };
    const onAuthChange = () => read();

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-change", onAuthChange as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-change", onAuthChange as any);
    };
  }, []);

  if (user) {
    return (
      <Link
        href="/account"
        className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-pink-600 text-pink-600 hover:bg-pink-50"
        aria-label="حساب کاربری"
      >
        <span className="i-lucide-user" />
        <span>حساب کاربری</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-pink-600 text-pink-600 hover:bg-pink-50"
      aria-label="ورود"
    >
      <span className="i-lucide-log-in" />
      <span>ورود</span>
    </Link>
  );
}
