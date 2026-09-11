/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@topla/ui", "@topla/utils", "@topla/types"],
};

module.exports = nextConfig;
