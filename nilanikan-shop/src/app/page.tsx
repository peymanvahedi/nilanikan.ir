// src/app/page.tsx
export const dynamic = "force-dynamic";

import BannerSlider from "../components/BannerSlider";
import StorySliderWrapper from "../components/StorySliderWrapper";
import VIPDealsSlider from "../components/VIPDealsSlider";
import CardSlider from "../components/CardSlider";
import MiniLooksSlider from "../components/MiniLooksSlider";
import BestSellersSlider from "../components/BestSellersSlider";
import BannersRow from "../components/BannersRow";
import NewArrivalsSlider from "../components/NewArrivalsSlider";
import type { Slide } from "@/types/home";
import { fetchHome } from "@/lib/api";

/* -------- MEDIA helpers (برای بنر) -------- */
const MEDIA_ORIGIN = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/$/, "").replace(/\/api$/, "");
const MEDIA_PREFIX = (process.env.NEXT_PUBLIC_MEDIA_PREFIX ?? "/media/").replace(/\/?$/, "/");

const absolutize = (url?: string | null): string => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  let path = url.startsWith("/") ? url : `/${url}`;
  if (!path.startsWith(MEDIA_PREFIX)) {
    if (/^\/?(slides|banners|uploads|media)\//i.test(path)) {
      if (!/^\/?media\//i.test(path)) path = `${MEDIA_PREFIX}${path.replace(/^\//, "")}`;
    } else {
      path = `${MEDIA_PREFIX}${path.replace(/^\//, "")}`;
    }
  }
  return MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${path}` : path;
};

type BannerApiItem = { id: number | string; image?: string; imageUrl?: string; href?: string | null; alt?: string | null; title?: string | null; };
type BannersApiResponse =
  | BannerApiItem[]
  | { count: number; next: string | null; previous: string | null; results: BannerApiItem[] };

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

/* ---------------- Page ---------------- */
export default async function Page() {
  // ✅ دادهٔ خانه از کلاینت مرکزی (نرمالایز + فالبک)
  const data = await fetchHome();

  // slides از خود API اگر بود، همان را بگیر؛ وگرنه از banners بساز
  const bannersFromHome = Array.isArray(data.heroSlides) ? data.heroSlides : [];
  const bannerItems = extractBanners(data.banners);
  const heroSlides: Slide[] =
    bannersFromHome.length > 0
      ? bannersFromHome.map((s: any, i: number) => ({
          ...s,
          imageUrl: absolutize(s.imageUrl ?? s.image ?? ""),
          link: s.link ?? s.href ?? undefined,
          alt: s.alt ?? s.title ?? `banner ${i + 1}`,
        }))
      : mapBannersToSlides(bannerItems);

  return (
    <main className="p-6 space-y-12">
      <section className="relative z-20">
        <BannerSlider {...(heroSlides.length ? { slides: heroSlides } : {})} />
      </section>

      <section aria-label="استوری تن‌خور بچه‌ها">
        <StorySliderWrapper items={(data.stories ?? []).slice(0, 50)} />
      </section>

      <section aria-label="پکیج VIP">
        <VIPDealsSlider
          endsAt={data.vip?.endsAt ?? new Date().toISOString()}
          seeAllLink={data.vip?.seeAllLink || "/vip"}
          products={data.vip?.products ?? []}
        />
      </section>

      <section aria-label="ست‌ها و پافر">
        <CardSlider
          title="ست‌ها و پافر"
          items={(data.setsAndPuffer?.items ?? []).slice(0, 20)}
          ctaHref="/products?tab=sets"
          ctaText="مشاهده همه"
        />
      </section>

      <section aria-label="تن‌خور کوچک بچه‌ها">
        <MiniLooksSlider items={(data.miniLooks ?? []).slice(0, 10)} />
      </section>

      <section aria-label="پرفروش‌ترین‌ها">
        <BestSellersSlider products={data.bestSellers ?? []} />
      </section>

      <section aria-label="بنرهای حراج">
        <BannersRow banners={bannerItems as any} />
      </section>

      <section aria-label="جدیدترین‌ها">
        <NewArrivalsSlider products={(data.newArrivals ?? []).slice(0, 8)} />
      </section>
    </main>
  );
}
