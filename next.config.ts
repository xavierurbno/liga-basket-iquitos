import type { NextConfig } from "next";

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
      // Evita errores 413 al enviar formularios con imágenes.
      bodySizeLimit: "8mb",
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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
