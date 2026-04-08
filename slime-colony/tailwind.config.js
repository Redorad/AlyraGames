/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'navy-900': '#0a0e27',
        'navy-800': '#111640',
        'navy-700': '#1a2050',
        steel: '#7ec8e3',
        accent: '#a78bfa',
      },
    },
  },
  plugins: [],
};
