// tailwind.config.js - 待实现
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      boxShadow: {
        'apple': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'apple-hover': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      colors: {
        gray: {
          50: '#F5F5F7', // Apple 底色
          100: '#E8E8ED',
          800: '#1D1D1F', // Apple 深色字体
        }
      }
    },
  },
  plugins: [],
}