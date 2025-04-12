import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    hmr: {
      overlay: false // Add this line
    },
    
    proxy: {
      // Proxy requests starting with /api/uploads to your backend
      '/api/uploads': {
        target: 'http://api.textevolve.in', // Your backend server
        changeOrigin: true, // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api\/uploads/, '/uploads') // Remove the '/api' prefix
      }
      // Add other proxies if needed
    }
  }
})
