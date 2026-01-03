/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure allowed origins for development
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['172.28.50.250'],
  }),
  
  // Vercel production configuration
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    poweredByHeader: false,
    generateEtags: false,
  }),
  
  // File upload configuration
  serverExternalPackages: ['pdf-parse-new'],
  
  // Environment variable handling
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;