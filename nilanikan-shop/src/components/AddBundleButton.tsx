"use client";

import { useCart } from "@/components/CartProvider";

export default function AddBundleButton(props: {
  id: number | string;
  price: number;
  qty?: number;
  title?: string;
  className?: string;
}) {
  const cart = useCart();
  const qty = props.qty ?? 1;

  const addBundle = () => {
    const c: any = cart as any;
    const payload = { kind: "bundle", id: Number(props.id), price: props.price, qty };

    if (typeof c.add === "function") return c.add(payload);
    if (typeof c.addLine === "function") return c.addLine(payload);
    if (typeof c.addItem === "function")
      return c.addItem({
        id: Number(props.id),
        name: props.title ?? `ست #${props.id}`,
        price: props.price,
        image: "",
        qty,
        kind: "bundle",
      });
    if (typeof c.push === "function") return c.push(payload);

    console.warn("No add method found on CartProvider");
  };

  return (
    <button
      type="button"
      onClick={addBundle}
      className={
        props.className ??
        "h-11 px-5 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 disabled:opacity-50"
      }
      aria-label={`افزودن ${props.title ?? `ست #${props.id}`} به سبد`}
    >
      افزودن به سبد
    </button>
  );
}
