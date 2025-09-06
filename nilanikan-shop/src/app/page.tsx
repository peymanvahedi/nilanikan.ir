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

/* ---------------- Types ---------------- */
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

/* -------- فقط از پروکسی Next استفاده کن -------- */
const API_PREFIX = "/api"; // همهٔ درخواست‌ها از همین مسیر بروند تا با rewrites → INTERNAL_API_URL پروکسی شوند

const MEDIA_ORIGIN = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/$/, "").replace(/\/api$/, "");

const MEDIA_PREFIX = (process.env.NEXT_PUBLIC_MEDIA_PREFIX ?? "/media/").replace(/\/?$/, "/");

/* -------- HELPERS -------- */
const toApi = (path: string) => `${API_PREFIX}/${path.replace(/^\/+/, "")}`;

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
  return MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${path}` : path; // اگر CDN نداری همون /media/... می‌مونه
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

/* --------- SSR fetch از طریق /api (پروکسی Next) --------- */
async function fetchHomeSSR(): Promise<HomeData> {
  try {
    const res = await fetch(toApi("home/"), { cache: "no-store", next: { revalidate: 0 } });
    if (res.ok) return (await res.json()) as HomeData;
  } catch {}
  return {
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

/* ---------------- Page ---------------- */
export default async function Page() {
  // ✅ برگشت به مدل درست: فقط از /api/* بخوان تا اتصال بک‌اند/فرانت از طریق rewrites برقرار باشد
  const data = await fetchHomeSSR();

  const bannersFromHome = Array.isArray(data.heroSlides) ? data.heroSlides : [];

  // fallback بنرها
  let bannerItems = extractBanners(data.banners);
  if (!bannerItems.length) {
    try {
      const res = await fetch(toApi("banners/"), { cache: "no-store", next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
      const json = await res.json();
      bannerItems = Array.isArray(json) ? json : (json.results ?? []);
    } catch {
      bannerItems = [];
    }
  }

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
