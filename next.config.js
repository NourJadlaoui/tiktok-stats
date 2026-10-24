/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone server (only the files
  // actually needed at runtime, deps traced and copied in) — used by the
  // Docker deployment path (see Dockerfile / README "Deploying to OVH
  // Public Cloud"). Doesn't change `npm run build` + `next start` at all,
  // it's an additional build artifact alongside the normal one.
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      { protocol: 'https', hostname: '**.tiktokcdn-us.com' },
      { protocol: 'https', hostname: 'p16-sign-va.tiktokcdn.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' }
    ]
  },
  serverExternalPackages: ['playwright']
};

module.exports = nextConfig;
