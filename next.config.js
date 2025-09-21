/** @type {import('next').NextConfig} */
const nextConfig = {
  // Restored for full Next.js functionality with Firebase App Hosting
  // output: 'export', // Removed - using server-side rendering
  // trailingSlash: true, // Removed - using default Next.js routing
  
  // Enable image optimization for server deployment
  images: {
    unoptimized: false, // Re-enable optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Environment variables for build-time only (non-sensitive)
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;