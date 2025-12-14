import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util/',
      crypto: 'crypto-browserify',
      events: 'events/',
    },
  },
  define: {
    'global': 'globalThis',
    'process.env': {},
    'process.version': JSON.stringify('v16.0.0'),
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util', 'events', 'stream-browserify'],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [],
    }
  }
})
