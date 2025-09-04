"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";

const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

export default function CartSheet() {
  const pathname = usePathname();
  // روی صفحه‌ی سبد، پنل کناری را نمایش نده
  if (pathname?.startsWith("/cart")) return null;

  const c: any = useCart();

  // خواندن ایمن از Provider
  const items: Array<{ kind: "product" | "bundle"; id: number; price: number; qty: number }> =
    Array.isArray(c?.items) ? c.items : [];

  const total: number =
    typeof c?.total === "number"
      ? c.total
      : items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

  const clear: () => void = typeof c?.clear === "function" ? c.clear : () => {};

  // متد حذف سازگار با نام‌های مختلف
  const removeLine = (kind: "product" | "bundle", id: number) => {
    if (typeof c?.remove === "function") return c.remove({ kind, id });
    if (typeof c?.removeLine === "function") return c.removeLine({ kind, id });
    if (typeof c?.delete === "function") return c.delete({ kind, id });
    if (typeof c?.deleteLine === "function") return c.deleteLine({ kind, id });
    // اگر هیچ‌کدام نبود، ساکت باشیم تا خطا نده
  };

  return (
    <div className="w-80 max-w-[90vw] p-4" dir="rtl">
      <h3 className="text-lg font-bold mb-3">سبد خرید</h3>

      {items.length === 0 ? (
        <div className="text-sm text-zinc-600">سبد خالی است.</div>
      ) : (
        <>
          <ul className="space-y-3 max-h-72 overflow-auto">
            {items.map((it) => {
              const title = it.kind === "bundle" ? `ست #${it.id}` : `محصول #${it.id}`;
              return (
                <li
                  key={`${it.kind}-${it.id}`}
                  className="flex items-center justify-between border rounded-lg p-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">{title}</div>
                    <div className="text-xs text-zinc-500">
                      {nf.format(Number(it.price) || 0)} × {Number(it.qty) || 1}
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(it.kind, it.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    حذف
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t pt-3 flex items-center justify-between">
            <span className="text-sm text-zinc-700">جمع کل</span>
            <span className="font-bold">{nf.format(total)} تومان</span>
          </div>

          <div className="mt-3 flex gap-2">
            <Link
              href="/checkout"
              className="flex-1 h-10 rounded-lg bg-green-600 text-white text-sm font-bold grid place-items-center"
            >
              تسویه حساب
            </Link>
            <button
              onClick={clear}
              className="h-10 px-3 rounded-lg bg-zinc-200 text-sm font-bold"
            >
              پاک‌کردن
            </button>
          </div>
        </>
      )}
    </div>
  );
}
