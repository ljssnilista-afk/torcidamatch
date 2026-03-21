import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // BSD Sports API (jogos em tempo real)
      '/bsd-api': {
        target: 'https://sports.bzzoiro.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bsd-api/, ''),
        secure: true,
      },
      // TorcidaMatch backend (auth, perfil)
      '/torcida-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/torcida-api/, ''),
      },
    },
  },
})
