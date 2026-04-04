import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'TorcidaMatch', // Nome completo do app
        short_name: 'TorcidaMatch', // Nome curto para a tela inicial
        description: 'Conecte sua torcida e vá junto ao estádio.',
        theme_color: '#22C55E', // Cor principal do seu app (verde)
        background_color: '#000000', // Cor de fundo do splash screen (preto)
        display: 'standalone', // Abre como app independente
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/apple-touch-icon.png', // ... (outros ícones)
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/icon-192x192.png', // Gere e coloque essa imagem na pasta public/
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png', // Gere e coloque essa imagem na pasta public/
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sports\.bzzoiro\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bsd-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
            },
          },
        ],
      },
    })
  ],
})