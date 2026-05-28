import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aquilens/shared"],
  // Playwright uses http://127.0.0.1 — allow dev asset requests from that host.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
