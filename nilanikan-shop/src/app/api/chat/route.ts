// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/productSearch";

function normalize(text: string) {
  return (text || "").toLowerCase().trim();
}

function makeAnswer(userMsg: string, hits: any[]) {
  const q = normalize(userMsg);

  if (q.includes("ارسال") || q.includes("پست") || q.includes("تحویل")) {
    return "ارسال سفارش‌ها بین ۲ تا ۵ روز کاری انجام می‌شود. هزینهٔ ارسال در مرحلهٔ پرداخت نمایش داده می‌شود.";
  }
  if (q.includes("مرجوع") || q.includes("تعویض")) {
    return "مرجوعی تا ۷ روز پس از تحویل با حفظ سلامت کالا امکان‌پذیر است.";
  }
  if (q.includes("سایز") || q.includes("اندازه")) {
    return "برای سایزبندی، جدول راهنمای سایز هر محصول را در همان صفحه ببینید. اگر نام محصول را بفرمایید، لینک مستقیم می‌دهم.";
  }
  if (q.includes("پرداخت") || q.includes("درگاه") || q.includes("زرین")) {
    return "پرداخت آنلاین از درگاه امن انجام می‌شود. در صورت بروز خطا مجدد تلاش کنید یا با پشتیبانی در ارتباط باشید.";
  }

  if (!hits?.length) return "محصول مرتبطی پیدا نکردم. لطفاً نام محصول، دسته‌بندی یا ویژگی را دقیق‌تر بفرمایید.";
  return "این‌ها پیشنهادهای مرتبط هستند؛ یکی را باز کنید یا دقیق‌تر بفرمایید.";
}

export async function POST(req: Request) {
  const { message, context } = await req.json().catch(() => ({}));

  // بهبود کوئری با کانتکست صفحه (اختیاری)
  let query: string = String(message || "");
  const p = context?.product;
  if (!query && (p?.title || p?.category)) {
    query = [p?.title, p?.category].filter(Boolean).join(" ");
  }

  const hits = await searchProducts(query);

  const reply = makeAnswer(query, hits);

  return NextResponse.json({
    reply,
    results: Array.isArray(hits) ? hits.slice(0, 6) : [],
    quickReplies: [
      "راهنمای سایز",
      "زمان ارسال",
      "شرایط مرجوعی",
      p?.title ? `محصول مشابه «${p.title}»` : "هودی راه‌راه",
    ],
  });
}
