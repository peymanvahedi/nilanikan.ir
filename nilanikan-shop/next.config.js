/** @type {import('next').NextConfig} */

// از env بخون تا با IP لوکال/موبایل یکی بشه
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "http://127.0.0.1:8000";
const mediaPrefix = (process.env.NEXT_PUBLIC_MEDIA_PREFIX || "/media/").replace(/\/?$/, "/");
const u = new URL(mediaBase);

// اگر از دستگاه/آی‌پی دیگه به dev سر می‌زنی، اینو ست کن:
// NEXT_DEV_ALLOWED_ORIGIN=http://192.168.103.17:3000
const devAllowedOrigins = [process.env.NEXT_DEV_ALLOWED_ORIGIN].filter(Boolean);

const backendOrigin = process.env.NEXT_BACKEND_ORIGIN || "http://127.0.0.1:8000";

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,

  // اخطار Next 15: دسترسی dev از مبدا دیگر (مثلا موبایل/شبکه)
  experimental: {
    ...(devAllowedOrigins.length ? { allowedDevOrigins: devAllowedOrigins } : {}),
  },

  images: {
    // اجازه لود تصویر از هاست مدیا
    remotePatterns: [
      {
        protocol: u.protocol.replace(":", ""), // "http" | "https"
        hostname: u.hostname,                  // مثلا "192.168.103.17" یا "127.0.0.1"
        port: u.port || undefined,             // مثلا "8000"
        pathname: `${mediaPrefix}**`,          // "/media/**"
      },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: `${mediaPrefix}**` },
      { protocol: "http", hostname: "localhost",  port: "8000", pathname: `${mediaPrefix}**` },

      // مثال: اگر از picsum استفاده می‌کنی
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
    // اگر می‌خوای بدون بهینه‌سازی لود شه:
    // unoptimized: true,
  },

  async rewrites() {
    // پروکسی داخلی برای درخواست‌های /api و /media به بک‌اند لوکال
    // توجه: مقصد نباید اسلش اضافه بگیره
    return [
      { source: "/api/:path*",   destination: `${backendOrigin}/api/:path*` },
      { source: "/media/:path*", destination: `${backendOrigin}/media/:path*` },
    ];
  },
};

module.exports = nextConfig;
