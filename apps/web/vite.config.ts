/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // Three.js is one lazy chunk (~150 kB gzip) loaded only by the explainer.
  build: { chunkSizeWarningLimit: 650 },
  // In development the tutor API runs separately: corepack pnpm dev:server
  server: { proxy: { '/api': 'http://localhost:8787' } },
  preview: { proxy: { '/api': 'http://localhost:8787' } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Lumen',
        short_name: 'Lumen',
        description: 'Offline-first adaptive learning. Your progress stays on this device.',
        theme_color: '#0b0d17',
        background_color: '#0b0d17',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // Precache everything the app needs so the core journey works with zero network.
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        // The tutor API must always hit the network; never serve it from the app cache.
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
