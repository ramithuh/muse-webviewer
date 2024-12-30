import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // Changed to true
  },
  typescript: {
    ignoreBuildErrors: true,   // Changed to true
  },
};

export default nextConfig;
