/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development-specific optimizations for faster dev server
  
  // Enable turbopack for much faster compilation (Next.js 13+)
  // Will be ignored in production build
  
  // Image optimization
  images: {
    unoptimized: true,
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
  
  // Suppress build warnings for expected dynamic server usage in API routes
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Webpack configuration with dev optimizations
  webpack: (config, { dev, isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    if (dev) {
      // Speed up dev builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Disable source maps in dev for faster builds (can enable if debugging)
      config.devtool = false;
    }
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Development-specific settings
  swcMinify: true, // Use SWC for faster minification (but doesn't affect dev much)
  
  // Disable strict mode in dev to reduce double-renders
  reactStrictMode: false,
  
  // Experimental features for faster dev
  experimental: {
    // Use faster incremental compilation
    // turbo: {}, // Uncomment if you want to try Turbopack (experimental)
  },
};

module.exports = nextConfig;
