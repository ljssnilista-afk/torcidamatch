import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bsd-api': {
        target: 'https://sports.bzzoiro.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bsd-api/, ''),
        secure: true,
      },
    },
  },
})
