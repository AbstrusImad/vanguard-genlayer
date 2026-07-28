/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/vanguard-genlayer',
  images: { unoptimized: true },
  trailingSlash: true,
};
module.exports = nextConfig;
