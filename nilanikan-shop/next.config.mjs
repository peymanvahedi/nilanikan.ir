// next.config.mjs

const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "http://127.0.0.1:8000";
const mediaPrefix = (process.env.NEXT_PUBLIC_MEDIA_PREFIX || "/media/").replace(/\/?$/, "/");
const u = new URL(mediaBase);

const backendOrigin = "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port || undefined, pathname: `${mediaPrefix}**` },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: `${mediaPrefix}**` },
      { protocol: "http", hostname: "localhost",  port: "8000", pathname: `${mediaPrefix}**` },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
    // unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/api/:path*",   destination: `${backendOrigin}/api/:path*/` },
      { source: "/media/:path*", destination: `${backendOrigin}/media/:path*` },
    ];
  },
};

export default nextConfig;
