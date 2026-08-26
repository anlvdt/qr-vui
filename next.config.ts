import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "",
  trailingSlash: true,
};

export default nextConfig;
