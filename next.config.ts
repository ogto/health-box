import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "ecimg.cafe24img.com",
      },
      {
        protocol: "https",
        hostname: "cloud.1472.ai",
        port: "18443",
      },
      {
        protocol: "http",
        hostname: "cloud.1472.ai",
      },
      {
        protocol: "https",
        hostname: "cdn.1472.ai",
      },
      {
        protocol: "http",
        hostname: "cloud.1472.ai",
        port: "8080",
      },
    ],
  },
};

export default nextConfig;
