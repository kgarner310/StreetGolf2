import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cutcrew/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf': ['jspdf'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
