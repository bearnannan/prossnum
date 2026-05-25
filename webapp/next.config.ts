import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";
import os from "os";

// Discover all local network IPv4 addresses dynamically so HMR works on local devices
const localIPs: string[] = ["localhost", "127.0.0.1"];
try {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const list = interfaces[interfaceName];
    if (list) {
      for (const info of list) {
        if (info.family === "IPv4" && !info.internal) {
          localIPs.push(info.address);
        }
      }
    }
  }
} catch (e) {
  console.error("Failed to dynamically detect local network interfaces:", e);
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../"),
  allowedDevOrigins: localIPs,
};

export default withPWA(nextConfig);
