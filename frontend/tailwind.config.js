/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(139, 92, 246)',
          dark: 'rgb(124, 58, 237)',
        },
        secondary: 'rgb(236, 72, 153)',
        accent: 'rgb(59, 130, 246)',
      },
    },
  },
  plugins: [],
}
