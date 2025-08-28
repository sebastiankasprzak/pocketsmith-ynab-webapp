import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
    host: 'localhost',
  },
  // Ensure environment variables are properly loaded
  envPrefix: 'VITE_',
})
