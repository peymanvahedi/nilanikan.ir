"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

export default function AddToCartModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  // یک کانتینر اختصاصی برای مودال در <body> بساز
  const portalEl = useMemo(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.setAttribute("id", "add-to-cart-portal");
    return el;
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!portalEl) return;

    document.body.appendChild(portalEl);
    return () => {
      try {
        document.body.removeChild(portalEl);
      } catch {}
    };
  }, [portalEl]);

  // بستن با ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // قفل اسکرول هنگام باز بودن
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !portalEl || !open) return null;

  const modalUi = (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      dir="rtl"
    >
      <div
        className="relative z-[1000001] w-[640px] max-w-[92vw] rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-extrabold">کالا به سبد خرید شما افزوده شد!</h3>
          <button
            aria-label="بستن"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 text-emerald-600">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xl">✓</span>
          <span className="font-medium">آیتم با موفقیت به سبد اضافه شد.</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href="/cart"
            className="grid h-12 place-items-center rounded-xl bg-pink-600 font-bold text-white"
          >
            مشاهده سبد خرید
          </Link>
          <button
            onClick={onClose}
            className="h-12 rounded-xl border-2 border-pink-600 font-bold text-pink-600"
          >
            ادامه دادن خرید
          </button>
        </div>
      </div>
    </div>
  );

  // رندر در body → دیگر هیچ گالری/thumbnailی نمی‌تواند روی مودال بیاید
  return createPortal(modalUi, portalEl);
}
