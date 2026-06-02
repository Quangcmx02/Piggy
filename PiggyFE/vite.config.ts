import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Khi npm run dev, /api → IntelliJ Spring Boot gateway
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Không rewrite path — gateway expect /api prefix
      }
    }
  }
})
