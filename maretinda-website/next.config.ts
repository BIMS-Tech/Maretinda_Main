import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CI sets NEXT_OUTPUT=export to publish a static build to Cloudflare Pages
  // (see .github/workflows/deploy-do.yml); local dev and `next start` are unaffected.
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
