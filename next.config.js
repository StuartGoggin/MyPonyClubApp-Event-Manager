/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase-admin');
    }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      // If you need syncWebAssembly, add: syncWebAssembly: true
    };
    
    return config;
  },
};

module.exports = nextConfig;
