/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1929',
        secondary: '#1A2332',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4E4B7',
          dark: '#B8941F',
        },
      },
    },
  },
  plugins: [],
}
