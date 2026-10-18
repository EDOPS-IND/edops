import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
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
