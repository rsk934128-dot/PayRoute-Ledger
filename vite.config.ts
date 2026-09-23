import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'pwa-192x192.jpg', 'pwa-512x512.jpg', 'apple-touch-icon.jpg', 'screenshot-mobile-1.jpg', 'screenshot-desktop-1.jpg'],
        manifest: {
          id: '/',
          name: 'PayRoute Ledger',
          short_name: 'PayRoute',
          description: 'Automated Ledger Transfer & Payment Routing System with ACID transactions and financial insights.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'portrait',
          categories: ['finance', 'business', 'utilities'],
          screenshots: [
            {
              src: '/screenshot-mobile-1.jpg',
              sizes: '1080x1920',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Dashboard Mobile View'
            },
            {
              src: '/screenshot-desktop-1.jpg',
              sizes: '1920x1080',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: 'Ledger Desktop View'
            }
          ],
          shortcuts: [
            {
              name: 'Ledger',
              short_name: 'Ledger',
              description: 'View transaction history',
              url: '/?tab=ledger',
              icons: [{ src: '/pwa-192x192.jpg', sizes: '192x192' }]
            },
            {
              name: 'Electricity Bill',
              short_name: 'Bills',
              description: 'Pay utility bills',
              url: '/?tab=electricity',
              icons: [{ src: '/pwa-192x192.jpg', sizes: '192x192' }]
            }
          ],
          icons: [
            {
              src: '/pwa-192x192.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
