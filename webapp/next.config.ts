import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

import path from "path";

const withPWA = withPWAInit({
  dest: "public",
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../"),
};

export default withPWA(nextConfig);
