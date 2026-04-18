// vite.config.js
import { defineConfig } from "file:///sessions/loving-sleepy-franklin/mnt/torcida-match-react/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/loving-sleepy-franklin/mnt/torcida-match-react/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///sessions/loving-sleepy-franklin/mnt/torcida-match-react/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => ({
  // Remover console.log e debugger apenas em produção
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : {},
  build: {
    // Code splitting manual — separa libs grandes em chunks dedicados
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "map-vendor": ["leaflet", "react-leaflet"],
          "crop-vendor": ["react-easy-crop"]
        }
      }
    },
    // Aumentar limite de aviso de chunk (opcional)
    chunkSizeWarningLimit: 600
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "TorcidaMatch",
        // Nome completo do app
        short_name: "TorcidaMatch",
        // Nome curto para a tela inicial
        description: "Conecte sua torcida e v\xE1 junto ao est\xE1dio.",
        theme_color: "#22C55E",
        // Cor principal do seu app (verde)
        background_color: "#000000",
        // Cor de fundo do splash screen (preto)
        display: "standalone",
        // Abre como app independente
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/apple-touch-icon.png",
            // ... (outros ícones)
            sizes: "180x180",
            type: "image/png"
          },
          {
            src: "/icon-192x192.png",
            // Gere e coloque essa imagem na pasta public/
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            // Gere e coloque essa imagem na pasta public/
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sports\.bzzoiro\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "bsd-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
                // 24 horas
              }
            }
          }
        ]
      }
    })
  ]
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvbG92aW5nLXNsZWVweS1mcmFua2xpbi9tbnQvdG9yY2lkYS1tYXRjaC1yZWFjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2xvdmluZy1zbGVlcHktZnJhbmtsaW4vbW50L3RvcmNpZGEtbWF0Y2gtcmVhY3Qvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2xvdmluZy1zbGVlcHktZnJhbmtsaW4vbW50L3RvcmNpZGEtbWF0Y2gtcmVhY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgLy8gUmVtb3ZlciBjb25zb2xlLmxvZyBlIGRlYnVnZ2VyIGFwZW5hcyBlbSBwcm9kdVx1MDBFN1x1MDBFM29cbiAgZXNidWlsZDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8geyBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSB9IDoge30sXG4gIGJ1aWxkOiB7XG4gICAgLy8gQ29kZSBzcGxpdHRpbmcgbWFudWFsIFx1MjAxNCBzZXBhcmEgbGlicyBncmFuZGVzIGVtIGNodW5rcyBkZWRpY2Fkb3NcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAnbWFwLXZlbmRvcic6IFsnbGVhZmxldCcsICdyZWFjdC1sZWFmbGV0J10sXG4gICAgICAgICAgJ2Nyb3AtdmVuZG9yJzogWydyZWFjdC1lYXN5LWNyb3AnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBBdW1lbnRhciBsaW1pdGUgZGUgYXZpc28gZGUgY2h1bmsgKG9wY2lvbmFsKVxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdtYXNrLWljb24uc3ZnJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnVG9yY2lkYU1hdGNoJywgLy8gTm9tZSBjb21wbGV0byBkbyBhcHBcbiAgICAgICAgc2hvcnRfbmFtZTogJ1RvcmNpZGFNYXRjaCcsIC8vIE5vbWUgY3VydG8gcGFyYSBhIHRlbGEgaW5pY2lhbFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbmVjdGUgc3VhIHRvcmNpZGEgZSB2XHUwMEUxIGp1bnRvIGFvIGVzdFx1MDBFMWRpby4nLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyMyMkM1NUUnLCAvLyBDb3IgcHJpbmNpcGFsIGRvIHNldSBhcHAgKHZlcmRlKVxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzAwMDAwMCcsIC8vIENvciBkZSBmdW5kbyBkbyBzcGxhc2ggc2NyZWVuIChwcmV0bylcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLCAvLyBBYnJlIGNvbW8gYXBwIGluZGVwZW5kZW50ZVxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2FwcGxlLXRvdWNoLWljb24ucG5nJywgLy8gLi4uIChvdXRyb3MgXHUwMEVEY29uZXMpXG4gICAgICAgICAgICBzaXplczogJzE4MHgxODAnLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvaWNvbi0xOTJ4MTkyLnBuZycsIC8vIEdlcmUgZSBjb2xvcXVlIGVzc2EgaW1hZ2VtIG5hIHBhc3RhIHB1YmxpYy9cbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9pY29uLTUxMng1MTIucG5nJywgLy8gR2VyZSBlIGNvbG9xdWUgZXNzYSBpbWFnZW0gbmEgcGFzdGEgcHVibGljL1xuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2ljb24tNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZScsXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyfSddLFxuICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvc3BvcnRzXFwuYnp6b2lyb1xcLmNvbVxcLy4qL2ksXG4gICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya0ZpcnN0JyxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnYnNkLWFwaS1jYWNoZScsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQsIC8vIDI0IGhvcmFzXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pXG4gIF0sXG59KSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQTBWLFNBQVMsb0JBQW9CO0FBQ3ZYLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQTtBQUFBLEVBRXpDLFNBQVMsU0FBUyxlQUFlLEVBQUUsTUFBTSxDQUFDLFdBQVcsVUFBVSxFQUFFLElBQUksQ0FBQztBQUFBLEVBQ3RFLE9BQU87QUFBQTtBQUFBLElBRUwsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGNBQWMsQ0FBQyxXQUFXLGVBQWU7QUFBQSxVQUN6QyxlQUFlLENBQUMsaUJBQWlCO0FBQUEsUUFDbkM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGVBQWU7QUFBQSxNQUN0RSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUE7QUFBQSxRQUNOLFlBQVk7QUFBQTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBO0FBQUEsUUFDYixrQkFBa0I7QUFBQTtBQUFBLFFBQ2xCLFNBQVM7QUFBQTtBQUFBLFFBQ1QsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQTtBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUE7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNYO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGNBQWMsQ0FBQyxzQ0FBc0M7QUFBQSxRQUNyRCxnQkFBZ0I7QUFBQSxVQUNkO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUMzQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
