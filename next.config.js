/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile Mesh SDK packages
  transpilePackages: [
    '@meshsdk/core',
    '@meshsdk/core-csl',
    '@meshsdk/core-cst',
    '@meshsdk/react',
  ],
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Polyfills for Node.js modules in browser
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util/',
      events: 'events/',
      process: 'process/browser',
      // Note: crypto uses custom polyfill in src/polyfills.ts instead of crypto-browserify
    },
    // Resolve extensions
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  webpack: (config, { isServer }) => {
    // Polyfills for Node.js modules in browser (fallback for webpack mode)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        crypto: require.resolve('crypto-browserify'),
        events: require.resolve('events/'),
        process: require.resolve('process/browser'),
      };

      // Add plugin for global variables
      config.plugins.push(
        new (require('webpack').ProvidePlugin)({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
