import { NextResponse } from "next/server";

type ProductOut = {
  id: string;
  title: string;
  price?: number;
  image?: string;
  href: string;
};

// نرمال‌سازی فارسی/عربی: ی/ي، ک/ك، همه انواع الف → ا، حذف کِشیده و اعراب
function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\u064A/g, "\u06CC") // ي → ی
    .replace(/\u0643/g, "\u06A9") // ك → ک
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // آ/أ/إ → ا
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // اعراب/کِشیده → حذف
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // علائم
    .replace(/\s+/g, " ")
    .trim();
}

// چک کردن وجود needle در عنوان (بعد از نرمال‌سازی)
// شاملِ «شامل بودن» + یک تطبیق نزدیک به کلمهٔ کامل
function titleHas(aTitle: string, needle: string) {
  const t = normalize(aTitle);
  const q = normalize(needle);
  if (!t || !q) return false;
  if (t.includes(q)) return true; // شامل بودن ساده
  // تلاش برای مرزبندی کلمه (ابتدا/وسط/انتها با فاصله)
  const re = new RegExp(`(^|\\s)${q}(?=\\s|$)`, "u");
  return re.test(t);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Number(searchParams.get("limit") || 8);
  if (!q) return NextResponse.json({ items: [] });

  const backend = (process.env.NEXT_BACKEND_ORIGIN || "http://192.168.28.17:8000").replace(/\/$/, "");
  // اگر DRF داری و SearchFilter فعاله:
  const url = `${backend}/api/products/?search=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `Backend error: ${res.status} ${text}`, items: [] }, { status: 502 });
    }

    const raw = await res.json();
    const arr: any[] = Array.isArray(raw) ? raw : (raw.results ?? raw.items ?? raw.data ?? []);

    // 🔎 فقط مواردی که "عنوان"شان شامل عبارت جست‌وجوست
    const filtered = arr.filter((p: any) => titleHas(p.title ?? p.name ?? "", q)).slice(0, limit);

    const items: ProductOut[] = filtered.map((p: any) => {
      const id    = String(p.id ?? p._id ?? "");
      const title = p.title ?? p.name ?? "";
      const slug  = p.slug ?? id;
      const href  = `/product/${slug}/`;
      const image =
        p.image ?? p.image_url ?? p.thumbnail ?? p.images?.[0]?.url ?? p.images?.[0] ?? undefined;

      const priceRaw = p.price ?? p.final_price ?? p.sale_price;
      const price =
        typeof priceRaw === "number" ? priceRaw :
        priceRaw ? Number(String(priceRaw).replace(/[^\d.]/g, "")) : undefined;

      return { id, title, price, image, href };
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err), items: [] }, { status: 500 });
  }
}
