import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  server: {
    host: '::',
    port: 8080,
    proxy: {
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('/src/pages/admin/')) {
            return 'admin-pages';
          }
          if (normalizedId.includes('/src/pages/Article') || normalizedId.includes('/src/pages/Articles')) {
            return 'article-pages';
          }
          if (
            normalizedId.includes('/src/pages/Login') ||
            normalizedId.includes('/src/pages/Signup') ||
            normalizedId.includes('/src/pages/ForgotPassword') ||
            normalizedId.includes('/src/pages/ResetPassword')
          ) {
            return 'auth-pages';
          }
          if (
            normalizedId.includes('/src/pages/Checkout') ||
            normalizedId.includes('/src/pages/Orders') ||
            normalizedId.includes('/src/pages/PaymentTracking') ||
            normalizedId.includes('/src/pages/Profile') ||
            normalizedId.includes('/src/pages/Cart')
          ) {
            return 'account-pages';
          }

          if (!normalizedId.includes('node_modules')) return undefined;

          if (
            normalizedId.includes('react-router') ||
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/')
          ) {
            return 'react-vendor';
          }

          if (normalizedId.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (
            normalizedId.includes('@radix-ui') ||
            normalizedId.includes('cmdk') ||
            normalizedId.includes('vaul')
          ) {
            return 'ui-vendor';
          }

          if (
            normalizedId.includes('framer-motion') ||
            normalizedId.includes('lucide-react')
          ) {
            return 'motion-vendor';
          }

          if (
            normalizedId.includes('recharts') ||
            normalizedId.includes('embla-carousel-react')
          ) {
            return 'charts-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});
