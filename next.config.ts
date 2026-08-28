import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les photos de cours / copies partent en base64 vers l'API (vision) :
  // on relève la limite par défaut (1 Mo) des route handlers.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
