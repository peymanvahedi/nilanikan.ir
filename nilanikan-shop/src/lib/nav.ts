// src/lib/nav.ts

export type NavItem = {
  label: string;
  href?: string;
  icon?: string; // آیکن فقط برای دسته‌بندی‌های اصلی
  children?: NavItem[];
};

export const NAV: NavItem[] = [
  {
    label: "پوشاک کودک",
    href: "/category/kids",
    icon: "Shirt", // آیکن متناسب با پوشاک
    children: [
      { label: "لباس زیر بچگانه", href: "http://192.168.103.17:3000/product/gdd" },
      { label: "شلوار", href: "/category/kids/pants" },
      { label: "پوشاک پاییزه و زمستانه", href: "/category/kids/fall-winter" },
      { label: "پوشاک بهاره و تابستانه", href: "/category/kids/spring-summer" },
      { label: "لباس مخصوص 3 تا 18 ماه", href: "/category/kids/3-18months" },
      { label: "حراج بزرگ تک سایز 60 درصد", href: "/category/kids/sale-60" },
      { label: "لباس مجلسی", href: "/category/kids/party" },
      { label: "ست ها", href: "/category/kids/sets" },
    ],
  },
];
