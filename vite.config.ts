import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util/',
      crypto: 'crypto-browserify',
      events: 'events/',
      process: 'process/browser',
    },
  },
  define: {
    'global': 'globalThis',
    'process.env': '{}',
    'process.version': '"v16.0.0"',
  },
  optimizeDeps: {
    include: ['buffer', 'process/browser', 'util', 'events', 'stream-browserify'],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      plugins: [],
    },
    sourcemap: false,
  }
})
