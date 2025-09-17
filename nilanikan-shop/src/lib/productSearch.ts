// src/lib/productSearch.ts
// TODO: این تابع را به منبع واقعی محصولات وصل کنید (مثلاً DB یا API داخلی پروژه)
// فعلاً نمونه‌ی ساده با فیلدهای لازم
export type Product = {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  stock?: number;
  sizes?: string[];
  category?: string;
  description?: string;
};

async function getAllProducts(): Promise<Product[]> {
  // ⬇️ اگر API دارید، اینجا fetch کنید. مثال:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`, { cache: "no-store" });
  // return await res.json();

  // نسخه‌ی موقت: بعداً حذف/جایگزین کنید
  return [];
}

export async function searchProducts(q: string): Promise<Product[]> {
  const all = await getAllProducts();
  const term = q.toLowerCase().trim();
  if (!term) return [];

  // جستجوی ساده بر اساس عنوان، دسته‌بندی، توضیحات
  return all
    .map(p => ({ 
      score: (
        (p.title||"").toLowerCase().includes(term) ? 3 : 0
      ) + (
        (p.category||"").toLowerCase().includes(term) ? 2 : 0
      ) + (
        (p.description||"").toLowerCase().includes(term) ? 1 : 0
      ),
      item: p
    }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.item);
}
