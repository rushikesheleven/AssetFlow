// @ts-ignore: Cannot find module 'vite' or its corresponding type declarations.
import { defineConfig } from 'vite'
// @ts-ignore: Cannot find module '@vitejs/plugin-react' or its corresponding type declarations.
import react from '@vitejs/plugin-react'
// @ts-ignore: Cannot find module '@tailwindcss/vite' or its corresponding type declarations.
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})