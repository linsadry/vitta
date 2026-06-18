import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ts = Date.now()

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${ts}.js`,
        chunkFileNames: `assets/[name]-${ts}.js`,
        assetFileNames: `assets/[name]-${ts}.[ext]`
      }
    }
  }
})
