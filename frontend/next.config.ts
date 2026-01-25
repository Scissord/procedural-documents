import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nurdaulet.com',
      },
    ],
  },
  // webpack: (config, { isServer }) => {
  // Добавляем псевдоним для @prisma/client
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     '@prisma/client': path.resolve(__dirname, './src/lib/prisma-client.ts'),
  //   };

  //   return config;
  // },
}

export default nextConfig;
