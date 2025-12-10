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
  webpack: (config, { dev, isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Development optimizations (won't affect production)
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Disable source maps in dev for much faster builds
      // Set to 'eval-source-map' if you need debugging
      config.devtool = false;
    }
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Disable strict mode for faster dev server (re-enable for production builds)
  reactStrictMode: process.env.NODE_ENV === 'production',
};

module.exports = nextConfig;