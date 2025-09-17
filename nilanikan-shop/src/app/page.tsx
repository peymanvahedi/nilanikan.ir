import BannerSlider from "../components/BannerSlider";
import StorySliderWrapper from "../components/StorySliderWrapper";
import VIPDealsSlider from "../components/VIPDealsSlider";
import CardSlider from "../components/CardSlider";
import MiniLooksSlider from "../components/MiniLooksSlider";
import BestSellersSlider from "../components/BestSellersSlider";
import BannersRow from "../components/BannersRow";

import type { Slide, BannerItem } from "@/types/home";
import { fetchHome, endpoints } from "../lib/api";

export const dynamic = "force-dynamic";

function listify(x: any): any[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.results)) return x.results;
  if (Array.isArray(x?.items)) return x.items;
  return [];
}

function firstTruthy<T = any>(...vals: T[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function mapToSlide(r: any): Slide {
  return {
    id: r.id ?? undefined,
    imageUrl: String(firstTruthy(r.imageUrl, r.image, r.url, r.src, "") || ""),
    link: firstTruthy(r.link, r.href, r.target),
    title: firstTruthy(r.title, r.name, "") as string,
  };
}
function mapToBanner(r: any): BannerItem {
  return {
    id: r.id ?? undefined,
    imageUrl: String(firstTruthy(r.imageUrl, r.image, r.url, r.src, "") || ""),
    link: firstTruthy(r.link, r.href, r.target),
    title: firstTruthy(r.title, r.name, "") as string,
  };
}

function mapToStoryForWrapper(r: any, i: number) {
  const img =
    firstTruthy(
      r.image,
      r.imageUrl,
      r.photo?.url,
      r.avatar,
      r.picture,
      r.cover,
      r.src,
      r.url,
      r.images?.[0]?.url,
      r.media?.main?.url
    ) || "";
  return {
    id: r.id ?? r._id ?? i,
    title: String(firstTruthy(r.title, r.caption, r.name, r.label, "")),
    image: String(img),
    link: firstTruthy(r.link, r.href, r.target),
    product: r.product?.slug
      ? { slug: r.product.slug }
      : r.product_slug
      ? { slug: r.product_slug }
      : undefined,
  };
}

function toCardItemBase(r: any) {
  const displayTitle = String(
    firstTruthy(
      r.title,
      r.name,
      r.product_name,
      r.productTitle,
      r.label,
      r.caption,
      r._raw?.title,
      r._raw?.name,
      r._raw?.product_title,
      r._raw?.name_fa,
      r._raw?.title_fa,
      "بدون نام"
    )
  );

  const imageUrl = String(
    firstTruthy(
      r.imageUrl,
      r.image,
      r.thumbnail,
      r.main_image,
      r.cover,
      r.photo?.url,
      r.images?.[0]?.url,
      r.media?.main?.url,
      r.pictures?.[0],
      r.gallery?.[0]
    ) || ""
  );

  const slug = firstTruthy(r.slug, r.handle, r.seoSlug, r._raw?.slug);
  const id = r.id ?? r._raw?.id;

  return { ...r, title: displayTitle, name: displayTitle, imageUrl, slug, id };
}

function toBundleCardItem(r: any) {
  const base = toCardItemBase(r);
  const hasSlug = base.slug && !/^\d+$/.test(String(base.slug));
  const href =
    firstTruthy(base.href, base.link, base.target) ||
    (hasSlug ? `/bundle/${base.slug}` : "/bundle");
  return { ...base, href };
}

function toProductCardItem(r: any) {
  const base = toCardItemBase(r);
  const href =
    firstTruthy(base.href, base.link, base.target) ||
    (base.slug ? `/product/${base.slug}` : undefined);
  return { ...base, href };
}

export default async function Page() {
  const data = await fetchHome();

  // ✅ بدون fallback
  const heroSlides: Slide[] = listify(data?.heroSlides).map(mapToSlide);
  const bannerItems: BannerItem[] = listify(data?.banners).map(mapToBanner);

  const storiesRaw = listify(data?.stories).slice(0, 50);
  const storiesProp = storiesRaw.length ? storiesRaw.map(mapToStoryForWrapper) : undefined;

  const vipProducts = listify(data?.vip?.products).slice(0, 12);

  const setsAndPufferItems = listify(data?.setsAndPuffer?.items).map(toBundleCardItem).slice(0, 12);
  const newArrivalsItems   = listify(data?.newArrivals).map(toProductCardItem).slice(0, 12);

  return (
    <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">

        {/* ✅ اسلایدر هدر فقط اگر داده دارد */}
        {heroSlides.length > 0 && (
          <section aria-label="اسلایدر هدر">
            <BannerSlider slides={heroSlides} />
          </section>
        )}

        <section aria-label="استوری‌ها">
          <h2 className="text-lg font-bold mb-3 sm:mb-4 text-pink-600 border-b-2 border-pink-500 inline-flex items-center gap-2">
            <span>🌟</span>
            تن‌خور بچه‌هایی که از ما خرید کردن
          </h2>
          <StorySliderWrapper limit={50} items={storiesProp} />
        </section>

        {vipProducts.length > 0 && (
          <section aria-label="پیشنهادهای VIP">
            <VIPDealsSlider
              products={vipProducts}
              endsAt={data?.vip?.endsAt}
              seeAllLink={data?.vip?.seeAllLink || "/vip"}
              title="پیشنهادهای VIP"
            />
          </section>
        )}

        <section aria-label="ست‌ها و پافر">
          <CardSlider
            title="ست‌ها و پافر"
            items={setsAndPufferItems}
            ctaHref="/collection/set"
            ctaText="مشاهده همه"
            hrefBase="/bundle"
            itemRibbon="پربازدید"
            itemRibbonTone="pink"
            variant="compact"
          />
        </section>

        <section aria-label="تن‌خور کوچک بچه‌ها">
          <MiniLooksSlider items={listify(data?.miniLooks).slice(0, 10)} />
        </section>

        <section aria-label="پرفروش‌ترین‌ها">
          <BestSellersSlider products={listify(data?.bestSellers)} />
        </section>

        {/* ✅ بنرها فقط اگر داده دارد */}
        {bannerItems.length > 0 && (
          <section aria-label="بنرهای حراج" className="py-1 sm:py-2">
            <BannersRow items={bannerItems} />
          </section>
        )}

        <section aria-label="جدیدترین‌ها">
          <CardSlider
            title="جدیدترین‌ها"
            items={newArrivalsItems}
            ctaHref="/new"
            ctaText="مشاهده همه"
            hrefBase="/product"
            itemRibbon="جدید"
            itemRibbonTone="pink"
            variant="compact"
          />
        </section>
      </div>

      <div className="h-6 sm:h-8 md:h-10" />
    </main>
  );
}
