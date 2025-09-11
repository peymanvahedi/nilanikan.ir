// src/types/home.ts
export type StoryItem = {
  id: string | number;
  title: string;
  imageUrl: string;
  link?: string;
};

export type ProductItem = {
  id: string | number;
  title: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number | null;
  link?: string;
  badge?: string | null;
};

export type BannerItem = {
  id?: string | number;
  imageUrl: string;
  link?: string;
  title?: string;
};

export type Slide = {
  id?: string | number;
  imageUrl: string;
  link?: string;
  title?: string;
  alt?: string;
};

export type HomePayload = {
  stories?: StoryItem[];

  /** پیشنهادهای ویژه */
  vip?: {
    endsAt?: string;
    seeAllLink?: string;
    products?: ProductItem[];
  };

  /** ست‌ها و پافر */
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
