import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://kana-backend-app.onrender.com',
        changeOrigin: true,
        // secure: false, // Uncomment if your backend is http
      }
    }
  }
})
