// src/lib/menu.ts
import { API_BASE } from "@/lib/api";

export type MenuItem = {
  id: number;
  name: string;
  slug: string;
  link: string;
  icon?: string | null;
  image?: string | null;
  open_in_new: boolean;
  children: MenuItem[];
};

export async function fetchMenu(device: "desktop" | "mobile" | "all" = "all") {
  const base = API_BASE.replace(/\/+$/, ""); // حذف اسلش‌های اضافی
  const res = await fetch(`${base}/menu-items/?device=${device}`, { cache: "no-store" });
  if (!res.ok) throw new Error("menu fetch failed");
  return (await res.json()) as MenuItem[];
}
