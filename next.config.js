/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@meshsdk/core', '@meshsdk/core-csl', '@meshsdk/core-cst'],
  turbopack: {
    resolveAlias: {
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util/',
      events: 'events/',
      process: 'process/browser',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  webpack: (config, { isServer }) => {
    // Exclude Mesh SDK from server-side bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@meshsdk/core': 'commonjs @meshsdk/core',
        '@meshsdk/core-csl': 'commonjs @meshsdk/core-csl',
        '@meshsdk/core-cst': 'commonjs @meshsdk/core-cst',
      });
    }
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
