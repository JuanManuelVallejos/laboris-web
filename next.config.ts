import type { NextConfig } from "next";

// Verificado en vivo en modo Report-Only (login, subida de fotos, portfolio,
// chat) sin violaciones — pasa a bloqueante real.
const csp = [
  "default-src 'self'",
  "script-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "connect-src 'self' https://laboris-api.onrender.com https://*.clerk.accounts.dev https://*.supabase.co",
  "img-src 'self' data: https://*.supabase.co https://img.clerk.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-src https://challenges.cloudflare.com",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
