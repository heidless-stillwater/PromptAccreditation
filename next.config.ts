import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/vertexai',
    '@google-cloud/aiplatform',
    '@googleapis/youtube',
    'stripe',
    '@opentelemetry/api'
  ],
  output: 'standalone',
};

export default nextConfig;
