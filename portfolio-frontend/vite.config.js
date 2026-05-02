import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Redirect all 404s to index.html for client-side routing
    historyApiFallback: true,
  },
})
