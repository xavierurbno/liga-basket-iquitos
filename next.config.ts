import type { NextConfig } from "next";
import {
  buildContentSecurityPolicy,
  buildPermissionsPolicy,
  buildStrictTransportSecurity,
} from "./src/lib/security/content-security-policy";

function supabaseStorageHostname(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    // Sin URL pública: patrón que nunca enruta a un proyecto real (evita filtrar ref en el repo).
    return "invalid.invalid";
  }
  try {
    return new URL(raw).hostname;
  } catch {
    return "invalid.invalid";
  }
}

const nextConfig: NextConfig = {
  // Evita que Next use el package-lock del monorepo padre en builds (Vercel/local).
  turbopack: {
    root: import.meta.dirname,
  },
  transpilePackages: ["framer-motion"],
  // sharp es un módulo nativo — debe ejecutarse externamente, no bundleado
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseStorageHostname(),
        port: "",
        // public, sign, render/image, etc.
        pathname: "/storage/v1/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Galería: subida por lotes (~8 fotos comprimidas por petición).
      bodySizeLimit: "20mb",
    },
  },
  reactStrictMode: false,
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/auth/callback",
        destination: "/auth/callback/",
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: buildPermissionsPolicy() },
      { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
    ];

    const hsts = buildStrictTransportSecurity();
    if (hsts) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: hsts,
      });
    }

    return [
      {
        source: "/auth/callback/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate, max-age=0",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
