/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swift: {
          red: '#E30613',
          dark: '#111111',
          card: '#161616',
          border: '#222222',
          gold: '#F2A900'
        }
      }
    },
  },
  plugins: [],
}
