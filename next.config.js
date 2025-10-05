/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // evita tentar empacotar pg-native (não usamos)
      config.externals.push('pg-native');
    }
    return config;
  },
};

module.exports = nextConfig;
