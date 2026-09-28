import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow file uploads through Server Actions (default is 1MB). Kept at the
    // platform request-body ceiling (~4.5MB) so limits stay consistent.
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent the site from being framed by others (clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Stop MIME-type sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limit referrer leakage.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable powerful APIs the app doesn't use.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Force HTTPS for two years.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
