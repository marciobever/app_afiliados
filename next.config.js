/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { unoptimized: true }, // se não usa Image Optimization/CDN
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // evita tentar empacotar o optional dependency do pg
      config.externals.push('pg-native');
    }
    return config;
  },
  async redirects() {
    // marketing ficou no domínio principal
    return [
      { source: '/como-funciona', destination: 'https://seureview.com.br/como-funciona', permanent: true },
      { source: '/privacidade',   destination: 'https://seureview.com.br/privacidade',   permanent: true },
      { source: '/termos',        destination: 'https://seureview.com.br/termos',        permanent: true },
    ];
  },
};
module.exports = nextConfig;