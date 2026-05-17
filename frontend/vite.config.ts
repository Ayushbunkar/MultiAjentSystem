import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point directly to the ESM build so Vite can resolve it
      'lenis': 'lenis/dist/lenis.mjs',
    },
  },
  optimizeDeps: {
    include: ['lenis'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
