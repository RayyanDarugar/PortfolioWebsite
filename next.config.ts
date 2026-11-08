import type { NextConfig } from "next";

// Static export so the site can be served by GitHub Pages (rayyandarugar.com).
// next/image's optimizer needs a server, so images ship as-is.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
