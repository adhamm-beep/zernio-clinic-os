import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    const developmentScriptPolicy =
      process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; form-action 'self' https://*.moyasar.com; frame-ancestors 'none'; object-src 'none'; img-src 'self' blob: data: https://*.supabase.co; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${developmentScriptPolicy}; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.moyasar.com; upgrade-insecure-requests` },
    ] }];
  },
};

export default nextConfig;
