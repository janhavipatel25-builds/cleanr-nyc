import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://janhavipatel25-builds.github.io/cleanr-nyc/ (GitHub Pages project site)
export default defineConfig({
  base: '/cleanr-nyc/',
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
})
