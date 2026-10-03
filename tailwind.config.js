/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F1EA',
        ink: '#202326',
        iron: '#B9683C',
        oxide: '#B94B43',
        blue: '#267FA3',
        green: '#3F9B72',
        slate: '#7D8587',
      },
      boxShadow: {
        lab: '0 12px 30px rgba(32, 35, 38, 0.12)',
      },
      fontFamily: {
        display: ['"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
