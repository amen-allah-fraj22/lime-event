import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../..'),
    optimizePackageImports: ['@clerk/nextjs', '@clerk/clerk-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // /explore/artists is the canonical browse experience: it is the one in
      // the bottom navigation, the one the dashboard and role switcher send
      // users to, and the only one that can open a booking request. /artists
      // was an earlier, less capable duplicate.
      { source: '/artists', destination: '/explore/artists', permanent: true },
    ];
  },
};

export default nextConfig;
