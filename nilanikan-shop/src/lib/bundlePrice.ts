import type { Bundle } from "@/types/bundle";
import { toDisplayToman } from "@/lib/money";

export function calcBundlePrice(bundle: Bundle): number {
  // مجموع قیمت‌ها (در همان واحدی که price ذخیره شده: ریال یا تومان)
  const total = bundle.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let final = total;

  if (bundle.discountType === "percent" && typeof bundle.discountValue === "number") {
    final = total * (1 - bundle.discountValue / 100);
  } else if (bundle.discountType === "fixed" && typeof bundle.discountValue === "number") {
    final = total - bundle.discountValue; // همان واحدِ price
  }

  // تبدیل به تومان + اعمال گرد کردن
  return toDisplayToman(final);
}
