import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el dev server desde la IP de la red local (celular).
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.44", "100.78.60.71"],
};

export default nextConfig;
