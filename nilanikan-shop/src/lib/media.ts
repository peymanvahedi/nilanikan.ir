// src/lib/media.ts
// —————————————————————————————————————————————
// ساخت آدرس مطلق برای تصاویر + گالری با fallback
// —————————————————————————————————————————————
import { MEDIA_BASE, MEDIA_PREFIX, toMedia, isAbsoluteUrl } from './config';

export type ImageLike =
  | string
  | { url?: string; image?: string; src?: string | null | undefined }
  | null
  | undefined;

const PLACEHOLDER = '/placeholder.svg'; // مطمئن شو این فایل تو public هست

const normalizePath = (p?: string | null) => (p || '').trim();

/** تلاش می‌کنیم از آبجکت/رشته مسیر عکس را دربیاریم */
const extractPath = (img: ImageLike): string | null => {
  if (!img) return null;
  if (typeof img === 'string') return normalizePath(img) || null;
  return (
    normalizePath(img.url) ||
    normalizePath(img.image) ||
    normalizePath(img.src ?? undefined) ||
    null
  );
};

/** آدرس مطلق (absolute) تصویر را می‌سازد. اگر چیزی نبود، placeholder می‌دهد */
export const absolutizeImage = (img: ImageLike): string => {
  const p = extractPath(img);
  if (!p) return PLACEHOLDER;

  // اگر خودش absolute است، همان را برگردان
  if (isAbsoluteUrl(p)) return p;

  // اگر MEDIA_BASE ست شده، از آن استفاده کن
  if (MEDIA_BASE) return toMedia(p);

  // در غیر این صورت از پروکسی /media استفاده کن
  return `${MEDIA_PREFIX}${p.replace(/^\/+/, '')}`;
};

/** چندین کاندید تصویر را می‌گیرد و یک گالری یکتا برمی‌گرداند (حداقل یک placeholder) */
export const resolveGallery = (candidates: ImageLike[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const c of candidates) {
    const url = absolutizeImage(c);
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }

  return out.length ? out : [PLACEHOLDER];
};
