// src/lib/nav.ts
// ساختار منو/زیرمنو به صورت داده‌محور (قابل ویرایش شما)
export type NavItem = {
  label: string;
  href?: string;
  icon?: string; // نام آیکن یا URL (اختیاری)
  children?: NavItem[];
};

// 🎯 نمونه: این‌ها را مطابق نیاز خودتان ویرایش/گسترش دهید
export const NAV: NavItem[] = [
  {
    label: "محصولات",
    href: "/products",
    children: [
      { label: "کالای دیجیتال", href: "/category/digital" },
      { label: "خانگی و آشپزخانه", href: "/category/home" },
      {
        label: "مد و پوشاک",
        href: "/category/fashion",
        children: [
          { label: "زنانه", href: "/category/fashion/women" },
          { label: "مردانه", href: "/category/fashion/men" },
          { label: "بچگانه", href: "/category/fashion/kids" },
        ],
      },
    ],
  },
  { label: "تخفیف‌ها", href: "/offers" },
  { label: "درباره ما", href: "/about" },
];
