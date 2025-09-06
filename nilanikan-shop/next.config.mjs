// next.config.mjs
/** @type {import('next').NextConfig} */

const INTERNAL_API_URL = (process.env.INTERNAL_API_URL || "http://web:8000/api").replace(/\/$/, "");
const ORIGIN_FROM_INTERNAL = INTERNAL_API_URL.replace(/\/api$/, "");

// اگر CDN مدیا داری، اینو ست کن. در غیر این صورت خالی بماند.
const MEDIA_BASE_PUBLIC = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").trim();

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,

  images: {
    remotePatterns: [
      // توسعه محلی
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      // Codespaces
      { protocol: "https", hostname: "**.app.github.dev", pathname: "/**" },
      // Placeholder service
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      // اگر CDN مدیا ست شده باشد
      ...(MEDIA_BASE_PUBLIC
        ? (() => {
            const u = new URL(MEDIA_BASE_PUBLIC);
            return [
              {
                protocol: u.protocol.replace(":", ""),
                hostname: u.hostname,
                port: u.port || "",
                pathname: "/**",
              },
            ];
          })()
        : []),
    ],
  },

  async rewrites() {
    return [
      // پروکسی API (با و بدون اسلش پایانی)
      { source: "/api/:path*/", destination: `${INTERNAL_API_URL}/:path*/` },
      { source: "/api/:path*", destination: `${INTERNAL_API_URL}/:path*/` },

      // پروکسی مدیا
      { source: "/media/:path*", destination: `${ORIGIN_FROM_INTERNAL}/media/:path*` },
    ];
  },
};

export default nextConfig;
