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
          50: '#f2f9f1',
          100: '#e1f2df',
          500: '#2e7d32', // Verde natural característico de VitaJuice
          600: '#236526',
          700: '#1b4d1d',
          accent: '#f59e0b', // Naranja cítrico energizante para shots
        }
      }
    },
  },
  plugins: [],
}
