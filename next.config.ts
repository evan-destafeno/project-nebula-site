import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cache Components is the stable Partial Prerendering API in Next 16
   * (replaces the deprecated `experimental.ppr`). Per-route opt-in via
   * `export const experimental_ppr = true` in any layout/page.
   */
  cacheComponents: true,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
