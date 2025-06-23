import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable SWC compiler for styled-components
  compiler: {
    styledComponents: true,
  },
  // Configure webpack for font handling
  webpack: (config, { isServer }) => {
    // Handle font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });

    return config;
  },
  // Enable font optimization (now that we're using SWC)
  optimizeFonts: true,
  // Enable React strict mode
  reactStrictMode: true,
  // Configure images
  images: {
    domains: ['localhost'],
  },
  // Enable source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
};

export default nextConfig;
