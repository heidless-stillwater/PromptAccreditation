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
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'node:fs': false,
        net: false,
        'node:net': false,
        tls: false,
        'node:tls': false,
        child_process: false,
        'node:child_process': false,
        crypto: false,
        'node:crypto': false,
        stream: false,
        'node:stream': false,
        http: false,
        'node:http': false,
        https: false,
        'node:https': false,
        http2: false,
        'node:http2': false,
        zlib: false,
        'node:zlib': false,
        path: false,
        'node:path': false,
        os: false,
        'node:os': false,
      };
      
      if (webpack) {
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^firebase-admin$|^google-auth-library$|^node:/,
          })
        );
      }
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
