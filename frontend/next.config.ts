import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  async rewrites() {
    return [
      {
        source: "/platform/:path*",
        destination: "/",
      },
      {
        source: "/login",
        destination: "/",
      },
      {
        source: "/invite",
        destination: "/",
      },
      {
        source: "/reset-password",
        destination: "/",
      },
      {
        source: "/:slug((?!api|_next|favicon|EDOPSLogo|.*\\..*).*)/:role/:path*",
        destination: "/",
      },
      {
        source: "/:slug((?!api|_next|favicon|EDOPSLogo|.*\\..*).*)/:role",
        destination: "/",
      },
      {
        source: "/:slug((?!api|_next|favicon|EDOPSLogo|.*\\..*).*)",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
