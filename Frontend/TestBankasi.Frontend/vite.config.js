import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    basicSsl()
  ],
  server: {
    port: 5173,      // <--- We FORCE the port here
    strictPort: true, // <--- If 5173 is busy, FAIL instead of picking a random port
    https: true
  }
})