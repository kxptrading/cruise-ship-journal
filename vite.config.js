import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Keep the existing public/manifest.json — don't let the plugin override it.
      manifest: false,
      workbox: {
        // Precache all compiled JS/CSS/HTML and public assets.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        // Runtime caching strategies per URL pattern.
        runtimeCaching: [
          {
            // Supabase REST + Auth API: try network first so data is always fresh
            // when online. Falls back to cached response when offline (read-only).
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Fluent Emoji SVGs from unpkg CDN: these are immutable for a given
            // emoji codepoint, so CacheFirst is safe and avoids repeated CDN hits.
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fluent-emoji',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Google Fonts: long-lived, cache forever after first fetch.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // Prevents vite:css-analysis from trying to open Tailwind's virtual CSS
  // imports in dev mode, which causes spurious ENOENT errors in the console.
  css: {
    devSourcemap: false,
  },
  server: {
    host: true,
    historyApiFallback: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
  },
})
