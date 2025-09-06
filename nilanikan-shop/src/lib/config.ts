// src/lib/config.ts
// —————————————————————————————————————————————
// مرکز تنظیم آدرس‌های API و Media برای کل پروژه
// کار می‌کند با env های: INTERNAL_API_URL, NEXT_PUBLIC_API_URL,
// NEXT_PUBLIC_MEDIA_BASE_URL, NEXT_PUBLIC_MEDIA_PREFIX
// —————————————————————————————————————————————

const trimEndSlash = (s = '') => s.replace(/\/+$/, '');
const ensureLeadingSlash = (s = '/') => ('/' + s).replace(/\/+$/, '/') as `/${string}`;

export const API_BASE = trimEndSlash(process.env.NEXT_PUBLIC_API_URL || '');          // e.g. https://api.example.com
export const INTERNAL_API = trimEndSlash(process.env.INTERNAL_API_URL || API_BASE);   // e.g. https://api.example.com/api
export const MEDIA_BASE = trimEndSlash(process.env.NEXT_PUBLIC_MEDIA_BASE_URL || ''); // e.g. https://cdn.example.com
export const MEDIA_PREFIX = ensureLeadingSlash(process.env.NEXT_PUBLIC_MEDIA_PREFIX || '/media/'); // must end with /

/** مسیر کامل fetch سمت کلاینت که از rewrite عبور می‌کند */
export const toApi = (path: string) => {
  const clean = path.replace(/^\/+/, '');
  return `/api/${clean}`;
};

/** ساخت URL فایل‌های مدیا. اگر MEDIA_BASE خالی باشد از پروکسی /media استفاده می‌شود. */
export const toMedia = (filePath: string) => {
  const clean = filePath.replace(/^\/+/, '');
  if (MEDIA_BASE) return `${MEDIA_BASE}${MEDIA_PREFIX}${clean}`;
  return `${MEDIA_PREFIX}${clean}`;
};

/** تشخیص اینکه یک رشته خودش URL مطلق است یا نه */
export const isAbsoluteUrl = (url?: string | null) => !!url && /^https?:\/\//i.test(url || '');
