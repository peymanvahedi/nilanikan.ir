import type { Bundle } from "@/types/bundle";

export const bundles: Bundle[] = [
  {
    id: 1,
    title: "ست زمستانی",
    description: "هودی + شلوار با تخفیف ویژه",
    discountType: "percent",
    discountValue: 20,
    items: [
      { productId: 1, name: "هودی بچگانه", price: 350_000, quantity: 1 },
      { productId: 2, name: "شلوار لی کودک", price: 420_000, quantity: 1 },
    ],
  },
];
