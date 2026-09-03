const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  /*
    Lets us import the translation resources shared with the Expo app
    (../lib/translations.ts) via the @shared alias. That module is deliberately
    dependency-free — see the comment at the top of it — so nothing needs to
    resolve out of the repo root, which Vercel does not install.
  */
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
