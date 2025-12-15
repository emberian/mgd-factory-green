/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#1a2e1a',  // Deep forest - primary bg
          800: '#243824',
          700: '#2d4a2d',  // Moss - secondary bg
          600: '#3d5c3d',
          500: '#4d6e4d',
        },
        sage: {
          DEFAULT: '#7cb87c',
          light: '#a8d9a8',  // Mint - bright accent
          dark: '#5a965a',
        },
        cream: {
          DEFAULT: '#e8f5e8',  // Text color
          dark: '#c8e0c8',
        },
        amber: {
          warm: '#d4a574',  // Warning color
        },
        success: '#5bb85b',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
