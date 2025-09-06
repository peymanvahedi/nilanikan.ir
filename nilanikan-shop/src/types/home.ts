export type StoryItem = {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
};

export type ProductItem = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number | null;
  link?: string;
  badge?: string | null;
};

export type BannerItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  link?: string | null;
};

/** اسلاید هدر صفحه اصلی */
export type Slide = {
  id: string;
  imageUrl: string;   // آدرس تصویر آماده برای <Image src=...>
  link?: string;      // مقصد کلیک (اختیاری)
  title?: string;     // عنوان اختیاری
  alt?: string;       // متن جایگزین اختیاری
};

export type HomePayload = {
  stories?: StoryItem[];

  /** پکیج VIP از باندل یا محصولات با تگ VIP */
  vip?: {
    endsAt?: string;                 // ISO datetime
    products?: ProductItem[];
    seeAllLink?: string;
  };

  /** ست‌ها و پافر از محصولات با تگ‌های مرتبط */
  setsAndPuffer?: {
    items?: ProductItem[];
  };

  miniLooks?: StoryItem[];
  bestSellers?: ProductItem[];
  banners?: BannerItem[];
  newArrivals?: ProductItem[];

  /** اسلایدهای بنر بالای صفحه (اختیاری) */
  heroSlides?: Slide[];
};
