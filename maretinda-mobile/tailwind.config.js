/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // The storefront's colours; src/theme.ts has the same ones
      colors: {
        primary: {
          DEFAULT: '#432C63',
          50: '#F6F2FB',
          100: '#EDE6F5',
          500: '#432C63',
          600: '#372248',
          700: '#2A1B3E',
        },
        accent: '#FFC533',
        surface: '#FAF8F5',
        border: '#EDEAE3',
      },
      fontFamily: {
        sans: ['System'],
        serif: ['DMSerifDisplay_400Regular'],
      },
    },
  },
  plugins: [],
};
