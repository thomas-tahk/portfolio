import process from 'node:process'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// BASE_PATH must start and end with '/', e.g. '/portfolio/preview/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/portfolio/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        play: resolve(import.meta.dirname, 'play/index.html'),
      },
    },
  },
})
