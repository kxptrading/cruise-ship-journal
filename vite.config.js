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
        // Precache compiled JS/CSS + public assets — all content-hashed and
        // immutable, so caching them forever is safe. index.html is deliberately
        // EXCLUDED (no 'html'): it's the one file that changes every deploy and
        // points at the new hashed chunks, so it must be fetched fresh (below).
        globPatterns: ['**/*.{js,css,png,svg,ico,woff,woff2}'],
        // Disable the default precache navigation fallback — index.html is no
        // longer precached, so binding navigations to it would throw. Our
        // NetworkFirst 'navigate' route below is the sole navigation handler.
        navigateFallback: null,
        // Runtime caching strategies per URL pattern.
        runtimeCaching: [
          {
            // App shell (HTML document / SPA navigations): NetworkFirst so a new
            // deploy shows up on a normal refresh instead of being pinned to the
            // service worker's cached copy. All navigations share ONE cache key
            // (/index.html) so any offline deep-link (/voyages/123, etc.) falls
            // back to the cached shell and React Router takes over. 4s timeout so
            // flaky cruise Wi-Fi drops to the cached shell fast.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
              plugins: [{ cacheKeyWillBeUsed: async () => '/index.html' }],
            },
          },
          {
            // Supabase REST + Auth API: try network first so data is always fresh
            // when online. Falls back to cached response when offline (read-only).
            // Timeout is deliberately short: cruise Wi-Fi is often "connected" but
            // has no real backhaul (multi-second latency), so a long wait just
            // leaves users staring at a spinner. If the network can't answer in 4s
            // they're effectively offline — serve the cache and let sync catch up.
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 4,
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
