// src/components/AddToCartButton.tsx
"use client";

import { useState } from "react";
import AddToCartModal from "@/components/AddToCartModal";
import { addToCart } from "@/lib/cart";
import { useCart as useCartHook } from "@/components/CartProvider";

type Props = {
  id: number;
  price: number;
  qty?: number; // تعداد
  name?: string;
  image?: string | null;
  className?: string;
  disabled?: boolean; // پراپ disabled
  children?: React.ReactNode; // پراپ children
};

export default function AddToCartButton(props: Props) {
  let cart: any = null;
  try {
    cart = useCartHook();
  } catch {}

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qty = props.qty ?? 1; // در صورتی که qty مشخص نباشد، پیش‌فرض 1 است

  const addLine = async () => {
    if (busy) return;
    setBusy(true);

    const line = {
      id: Number(props.id),
      name: props.name ?? `محصول #${props.id}`,
      price: props.price,
      image: props.image ?? null,
      qty, // تعداد انتخاب‌شده
      kind: "product" as const,
    };

    try {
      if (cart && typeof cart.addItem === "function") cart.addItem(line, qty);
      else if (cart && typeof cart.add === "function") cart.add(line);
      else if (cart && typeof cart.addLine === "function") cart.addLine(line);
      else if (cart && typeof cart.push === "function") cart.push(line);
      else {
        await addToCart({ id: line.id, name: line.name, price: line.price, image: line.image }, qty);
      }

      try {
        localStorage.setItem("cart:ts", String(Date.now()));
        window.dispatchEvent(new Event("cart-change"));
      } catch {}

      setOpen(true);
      if (cart && typeof cart.open === "function") cart.open();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
  data-testid="add-to-cart"
  onClick={addLine}
  disabled={props.disabled || busy}
  aria-busy={busy}
  className={
    props.className ??
    "h-12 w-full rounded-xl bg-pink-600 font-bold text-white hover:bg-pink-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
  }
>

        {busy ? "در حال افزودن..." : props.children || "افزودن به سبد خرید 🛒"}
      </button>

      <AddToCartModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
