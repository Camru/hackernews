import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Hacker News',
        short_name: 'Hacker News',
        description: 'A Hacker News reader with an offline-readable snapshot.',
        theme_color: '#f0eee6',
        background_color: '#f0eee6',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      // The HN/Algolia APIs are intentionally not runtime-cached here — the
      // offline snapshot in IndexedDB (src/offline) owns data availability.
      // This service worker only needs to make the app shell itself
      // (JS/CSS/HTML) loadable with zero network.
    }),
  ],
})
