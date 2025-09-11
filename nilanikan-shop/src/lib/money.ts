export const PRICE_UNIT =
  (process.env.NEXT_PUBLIC_PRICE_UNIT || "rial").toLowerCase() as
    | "rial"
    | "toman";

/** عدد را (از string هم) می‌خواند و به «تومان» تبدیل می‌کند */
export function toTomanNumber(v: unknown): number | null {
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return null;
  // اگر قیمت‌ها در بک‌اند «ریال» هستند → تقسیم بر 10
  return PRICE_UNIT === "rial" ? Math.round(n / 10) : Math.round(n);
}

/** نمایش فارسی با جداکننده هزار و بدون اعشار */
export function formatToman(v: unknown): string {
  const t = toTomanNumber(v);
  return t === null ? "—" : t.toLocaleString("fa-IR");
}
