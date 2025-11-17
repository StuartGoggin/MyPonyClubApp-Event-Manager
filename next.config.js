/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebase App Hosting will handle the build output configuration
  // Do not set output mode - let Firebase adapter manage it
  
  // Enable image optimization for server deployment
  images: {
    unoptimized: true, // Disable optimization for Firebase App Hosting compatibility
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