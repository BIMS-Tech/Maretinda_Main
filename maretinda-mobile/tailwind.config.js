/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B1072',
          50: '#F5EEF8',
          100: '#E6D0EF',
          500: '#5B1072',
          600: '#4D0D61',
          700: '#3D0A4D',
        },
        surface: '#F8F8F8',
        border: '#E5E5E5',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
