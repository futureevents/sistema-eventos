import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
