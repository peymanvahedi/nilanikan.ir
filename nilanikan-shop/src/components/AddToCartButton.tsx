"use client";

import { useState } from "react";
import AddToCartModal from "@/components/AddToCartModal";
import { addToCart } from "@/lib/cart";
// اگر Provider موجود باشد استفاده می‌کنیم؛ اگر نبود، خطا نمی‌دهیم
import { useCart as useCartHook } from "@/components/CartProvider";

type Props = {
  id: number;
  price: number;
  qty?: number;
  name?: string;
  image?: string | null;
  className?: string;
};

export default function AddToCartButton(props: Props) {
  // امن: اگر Provider نباشد، try/catch جلوگیری می‌کند
  let cart: any = null;
  try {
    cart = useCartHook();
  } catch {}

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qty = props.qty ?? 1;

  const addLine = async () => {
    if (busy) return;
    setBusy(true);

    const line = {
      id: Number(props.id),
      name: props.name ?? `محصول #${props.id}`,
      price: props.price,
      image: props.image ?? null,
      qty,
      kind: "product" as const,
    };

    try {
      if (cart && typeof cart.addItem === "function") cart.addItem(line, qty);
      else if (cart && typeof cart.add === "function") cart.add(line);
      else if (cart && typeof cart.addLine === "function") cart.addLine(line);
      else if (cart && typeof cart.push === "function") cart.push(line);
      else {
        // fallback: هلسپر ما (به سرور/LocalStorage)
        await addToCart({ id: line.id, name: line.name, price: line.price, image: line.image }, qty);
      }

      // اعلان تغییر سبد برای هدر/کامپوننت‌های دیگر
      try {
        localStorage.setItem("cart:ts", String(Date.now()));
        window.dispatchEvent(new Event("cart-change"));
      } catch {}

      // نمایش مودال موفقیت
      setOpen(true);
      if (cart && typeof cart.open === "function") cart.open();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={addLine}
        disabled={busy}
        aria-busy={busy}
        className={
          props.className ??
          "h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        }
      >
        {busy ? "در حال افزودن..." : "افزودن به سبد خرید 🛒"}
      </button>

      <AddToCartModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
