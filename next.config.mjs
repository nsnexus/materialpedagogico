import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// No `next dev`, simula localmente os bindings do wrangler.toml (KV e R2).
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
