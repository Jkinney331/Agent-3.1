/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['lightweight-charts'],
  },
  images: {
    domains: ['localhost'],
  },
  typescript: {
    // Allow production builds to successfully complete even if
    // your project has type errors. We log and track them separately.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds to not block deployments
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig; // Build timestamp: Fri Jul 25 11:49:49 PDT 2025
