import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/platform/:path*",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
