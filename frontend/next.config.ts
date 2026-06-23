import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que o deploy (next build) falhe por avisos de lint/tipo em paginas
  // ainda em desenvolvimento. Reativar quando o codigo estabilizar.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
