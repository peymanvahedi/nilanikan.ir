import Link from "next/link";
import SafeImg from "@/components/SafeImg";

const posts = [
  {
    slug: "size-guide-kids",
    title: "راهنمای انتخاب سایز لباس کودک",
    excerpt: "با این نکات ساده، سایز درست را برای فرزندتان انتخاب کنید.",
    cover: "https://picsum.photos/seed/size/800",
    date: "1404/06/09",
  },
  {
    slug: "autumn-outfits",
    title: "استایل‌های پاییزی بچه‌ها",
    excerpt: "ترکیب‌های گرم و راحت برای پاییز امسال.",
    cover: "https://picsum.photos/seed/autumn/800",
    date: "1404/06/05",
  },
  {
    slug: "fabric-tips",
    title: "شناخت جنس پارچه برای کودکان",
    excerpt: "کدام پارچه‌ها برای پوست حساس کودک مناسب‌تر است؟",
    cover: "https://picsum.photos/seed/fabric/800",
    date: "1404/05/28",
  },
];

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-pink-600 mb-6">وبلاگ</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block border rounded-2xl overflow-hidden bg-white shadow hover:shadow-lg transition"
          >
            <div className="aspect-video overflow-hidden">
              <SafeImg src={post.cover} alt={post.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="text-xs text-zinc-500 mb-2">{post.date}</div>
              <h2 className="font-bold text-zinc-800 mb-1 line-clamp-1">{post.title}</h2>
              <p className="text-sm text-zinc-600 line-clamp-2">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
