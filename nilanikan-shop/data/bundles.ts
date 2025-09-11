// data/bundles.ts
export const bundles = [
  {
    id: 1,
    title: "ست زمستانی",
    description: "هودی + شلوار با تخفیف ویژه",
    discountType: "percent", // یا fixed
    discountValue: 20,       // 20 درصد
    items: [
      { productId: 1, name: "هودی بچگانه", price: 350000, quantity: 1 },
      { productId: 2, name: "شلوار لی کودک", price: 420000, quantity: 1 },
    ],
  },
];
