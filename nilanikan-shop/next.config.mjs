/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // 👈 باعث میشه همه‌ی عکس‌ها مستقیم لود بشن
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**", // 👈 هر دامنه‌ای
      },
      {
        protocol: "https",
        hostname: "**", // 👈 هر دامنه‌ای
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://web:8000/api/:path*" },
      { source: "/media/:path*", destination: "http://web:8000/media/:path*" },
    ];
  },
};

export default nextConfig;
