export type DiscountType = "percent" | "fixed";

export interface BundleItem {
  productId: number;
  name: string;
  price: number;    // قیمت واحد
  quantity: number;
}

export interface Bundle {
  id: number;
  title: string;
  description?: string;
  discountType?: DiscountType;  // اختیاری در MVP
  discountValue?: number;       // اختیاری
  items: BundleItem[];
}
