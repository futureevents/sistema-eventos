import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client Router Cache: reaproveita o render de uma List por alguns segundos,
  // então alternar entre Lists recém-visitadas fica instantâneo (sem refetch).
  // O default de `dynamic` é 0 — ou seja, hoje refaz tudo a cada navegação.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async redirects() {
    return [
      {
        source: '/eventos',
        destination: '/entregas/base-de-dados/eventos',
        permanent: true,
      },
      {
        source: '/eventos/novo',
        destination: '/entregas/base-de-dados/eventos/novo',
        permanent: true,
      },
      {
        source: '/eventos/:id',
        destination: '/entregas/base-de-dados/eventos/:id',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
