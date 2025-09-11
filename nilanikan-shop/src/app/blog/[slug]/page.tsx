import { notFound } from "next/navigation";
import SafeImg from "@/components/SafeImg";

const posts = [
  {
    slug: "size-guide-kids",
    title: "راهنمای انتخاب سایز لباس کودک",
    content: `
      انتخاب سایز درست لباس کودک همیشه یک چالش است. 
      برای این کار بهتر است دور سینه، قد و وزن کودک را اندازه بگیرید 
      و با جدول سایزبندی برند مطابقت دهید.
    `,
    cover: "https://picsum.photos/seed/size/1200/600",
    date: "1404/06/09",
  },
  {
    slug: "autumn-outfits",
    title: "استایل‌های پاییزی بچه‌ها",
    content: `
      پاییز بهترین فصل برای ست‌کردن لباس‌های گرم و شیک برای کودکان است.
      می‌توانید از هودی‌ها، شلوارهای راحتی و بوت‌های سبک استفاده کنید.
    `,
    cover: "https://picsum.photos/seed/autumn/1200/600",
    date: "1404/06/05",
  },
  {
    slug: "fabric-tips",
    title: "شناخت جنس پارچه برای کودکان",
    content: `
      پوست کودکان حساس است و باید پارچه‌هایی مانند نخ و پنبه را انتخاب کنید.
      این جنس‌ها علاوه بر راحتی، ضد حساسیت نیز هستند.
    `,
    cover: "https://picsum.photos/seed/fabric/1200/600",
    date: "1404/05/28",
  },
];

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <SafeImg
        src={post.cover}
        alt={post.title}
        className="w-full h-64 md:h-96 object-cover rounded-2xl mb-6"
      />
      <h1 className="text-2xl font-bold text-zinc-800 mb-2">{post.title}</h1>
      <div className="text-xs text-zinc-500 mb-6">{post.date}</div>
      <article className="prose prose-zinc max-w-none prose-p:leading-7">
        {post.content}
      </article>
    </main>
  );
}
