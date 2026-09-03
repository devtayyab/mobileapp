const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Allow importing the shared translation resources from the repo root
  // (../lib/i18n.ts) — it only depends on i18next/react-i18next, so it is web-safe.
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@shared'] = path.join(__dirname, '..');
    return config;
  },
};

module.exports = nextConfig;
