/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F6',
          100: '#FFE5EA',
          200: '#FFCCD5',
          300: '#FFA3B3',
          400: '#FF6B8A',
          500: '#FF4D6D',
          600: '#E8345A',
          700: '#C91F47',
          800: '#A8193C',
          900: '#8B1636',
        },
      },
    },
  },
  plugins: [],
}

