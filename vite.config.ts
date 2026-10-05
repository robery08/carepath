import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages hosts this project in a subdirectory; other hosts use their domain root.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/carepath/' : '/',
  plugins: [react()],
})
