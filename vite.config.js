import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: "./"  -> percorsi relativi, compatibile con GitHub Pages
// (https://pezzaliapp.github.io/leadscan-pwa/)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
