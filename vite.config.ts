import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'GDMT-VN – Phác đồ nhanh 9 bệnh mạn tính',
        short_name: 'GDMT-VN',
        description: 'Phác đồ điều trị nội khoa tối ưu chuẩn y khoa theo guideline quốc tế và Bộ Y tế',
        theme_color: '#14285a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        // Pure JSON data can be cached independently without changing KB initialization.
        manualChunks(id) {
          const kbGroup = id.replace(/\\/g, '/').match(/\/kb\/(citations|drugs|interactions|review|thresholds)\//)?.[1];
          if (kbGroup) return `kb-${kbGroup}`;
          const clinicalModule = id.replace(/\\/g, '/').match(/\/src\/modules\/([^/]+)\//)?.[1];
          if (clinicalModule) return `module-${clinicalModule}`;
        }
      }
    }
  },
  server: {
    host: true,
    port: 5180
  },
  preview: {
    host: true,
    port: 5180
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts?(x)'],
    testTimeout: 180000
  }
});
