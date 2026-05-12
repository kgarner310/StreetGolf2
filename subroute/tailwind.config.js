/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fafaf5',
          100: '#f2f2e0',
          200: '#e5e5c0',
          300: '#d0d08a',
          400: '#b8b84a',
          500: '#9a9a2a',
          600: '#787820',
          700: '#5a5a18',
          800: '#3d3d10',
          900: '#242408',
        },
        slate: {
          850: '#1a2030',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
