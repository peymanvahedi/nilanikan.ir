// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      // ────── بک‌اند روی شبکهٔ محلی (IP درست) ──────
      { protocol: "http", hostname: "192.168.28.17", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "192.168.28.17", port: "8000", pathname: "/static/**" },

      // ────── localhost (برای اجرا روی همان سیستم) ──────
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/static/**" },

      // ────── تصاویر نمونه (اختیاری) ──────
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async rewrites() {
    // اگر متغیر محیطی ست بود از همون استفاده کن، وگرنه IP محلی
    const backend = process.env.NEXT_BACKEND_ORIGIN || "http://192.168.28.17:8000";
    return [
      { source: "/api/:path*",   destination: `${backend}/api/:path*` },
      { source: "/media/:path*", destination: `${backend}/media/:path*` },
      { source: "/static/:path*", destination: `${backend}/static/:path*` },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
