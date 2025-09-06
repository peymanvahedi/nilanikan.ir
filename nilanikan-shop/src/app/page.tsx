// app/page.tsx
export const dynamic = "force-dynamic";

import BannerSlider from "../components/BannerSlider";
import StorySliderWrapper from "../components/StorySliderWrapper";
import VIPDealsSlider from "../components/VIPDealsSlider";
import CardSlider from "../components/CardSlider";
import MiniLooksSlider from "../components/MiniLooksSlider";
import BestSellersSlider from "../components/BestSellersSlider";
import BannersRow from "../components/BannersRow";
import NewArrivalsSlider from "../components/NewArrivalsSlider";
import { fetchHome } from "@/lib/api";
import type { Slide } from "@/types/home";

// برای ساخت URL مطلق وقتی API تصویر مسیر نسبی می‌دهد
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

// اگر مسیر /media/ باشد، همان نسبی بماند تا از پروکسی Next استفاده شود
const absolutize = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("/media/")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return API_ORIGIN ? `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}` : url;
};

type BannerApiItem = {
  id: number | string;
  image?: string;
  imageUrl?: string;
  href?: string | null;
  alt?: string | null;
  title?: string | null;
};
type BannersApiResponse =
  | BannerApiItem[]
  | { count: number; next: string | null; previous: string | null; results: BannerApiItem[] };

type HomeData = {
  stories?: any[];
  vip?: { endsAt?: string; products?: any[]; seeAllLink?: string };
  setsAndPuffer?: { items?: any[] };
  miniLooks?: any[];
  bestSellers?: any[];
  banners?: BannersApiResponse;
  newArrivals?: any[];
  heroSlides?: Slide[];
};

function extractBanners(b: BannersApiResponse | undefined): BannerApiItem[] {
  if (!b) return [];
  if (Array.isArray(b)) return b;
  return Array.isArray(b.results) ? b.results : [];
}

function mapBannersToSlides(banners: BannerApiItem[]): Slide[] {
  return (banners ?? [])
    .map((b, i) => ({
      id: String(b?.id ?? i),
      imageUrl: absolutize(b.imageUrl ?? b.image ?? ""),
      link: (b.href ?? "#") as string,
      alt: (b.alt ?? b.title ?? `banner ${i + 1}`) as string,
      title: b.title ?? undefined,
    }))
    .filter((s) => !!s.imageUrl);
}

export default async function Page() {
  let data: HomeData;
  try {
    data = (await fetchHome()) as unknown as HomeData;
  } catch {
    data = {
      stories: [],
      vip: { endsAt: new Date().toISOString(), products: [], seeAllLink: "/vip" },
      setsAndPuffer: { items: [] },
      miniLooks: [],
      bestSellers: [],
      banners: [],
      newArrivals: [],
      heroSlides: [],
    };
  }

  // بنرها از API هوم
  const bannersFromHome = Array.isArray(data.heroSlides) ? data.heroSlides : [];

  // بنرهای جداگانه
  let bannerItems = extractBanners(data.banners);
  if (!bannerItems.length) {
    try {
      // استفاده از rewrite داخلی Next: /api/* → بک‌اند
      const res = await fetch("/api/banners/", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
      const json = await res.json();
      bannerItems = Array.isArray(json) ? json : (json.results ?? []);
    } catch (e) {
      console.error("fallback banners fetch failed:", e);
      bannerItems = [];
    }
  }

  // اگر heroSlides خالی بود → از بنرها استفاده کن
  const heroSlides: Slide[] =
    bannersFromHome.length > 0
      ? bannersFromHome.map((s, i) => ({
          ...s,
          imageUrl: absolutize((s as any).imageUrl ?? (s as any).image ?? ""),
          link: (s as any).link ?? (s as any).href ?? undefined,
          alt: s.alt ?? s.title ?? `banner ${i + 1}`,
        }))
      : mapBannersToSlides(bannerItems);

  return (
    <main className="p-6 space-y-12">
      {/* مرحله ۰: بنر بالای صفحه */}
      <section className="relative z-20">
        <BannerSlider {...(heroSlides.length ? { slides: heroSlides } : {})} />
      </section>

      {/* مرحله ۱: استوری‌ها */}
      <section aria-label="استوری تن‌خور بچه‌ها">
        <StorySliderWrapper items={(data.stories ?? []).slice(0, 50)} />
      </section>

      {/* مرحله ۲: VIP */}
      <section aria-label="پکیج VIP">
        <VIPDealsSlider
          endsAt={data.vip?.endsAt ?? new Date().toISOString()}
          seeAllLink={data.vip?.seeAllLink || "/vip"}
          products={data.vip?.products ?? []}
        />
      </section>

      {/* مرحله ۳: ست‌ها و پافر */}
      <section aria-label="ست‌ها و پافر">
        <CardSlider
          title="ست‌ها و پافر"
          items={(data.setsAndPuffer?.items ?? []).slice(0, 20)}
          ctaHref="/products?tab=sets"   // ← اینجا اصلاح شد
          ctaText="مشاهده همه"
        />
      </section>

      {/* مرحله ۴: تن‌خور کوچک */}
      <section aria-label="تن‌خور کوچک بچه‌ها">
        <MiniLooksSlider items={(data.miniLooks ?? []).slice(0, 10)} />
      </section>

      {/* مرحله ۵: پرفروش‌ترین‌ها */}
      <section aria-label="پرفروش‌ترین‌ها">
        <BestSellersSlider products={data.bestSellers ?? []} />
      </section>

      {/* مرحله ۶: بنرهای حراج */}
      <section aria-label="بنرهای حراج">
        <BannersRow banners={bannerItems as any} />
      </section>

      {/* مرحله ۷: جدیدترین‌ها */}
      <section aria-label="جدیدترین‌ها">
        <NewArrivalsSlider products={(data.newArrivals ?? []).slice(0, 8)} />
      </section>
    </main>
  );
}
