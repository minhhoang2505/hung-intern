import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "test1.local",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;