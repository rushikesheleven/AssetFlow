/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F766E', // Crisp Teal
          dark: '#115E59',
        },
        surface: '#FFFFFF',
        background: '#F9FAFB', // Light gray background
      }
    },
  },
  plugins: [],
}