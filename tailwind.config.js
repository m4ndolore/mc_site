/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mc-black': '#0B0E11',
        'mc-charcoal': '#1C232B',
        'mc-slate': '#2C3036',
        'mc-blue': '#2A7FDB',
        'mc-blue-dark': '#1E5FA8',
        'mc-blue-light': '#4A9FFF',
        'mc-offwhite': '#F2F5F7',
        'mc-green': '#5DA06F',
      },
      fontFamily: {
        'primary': ['Inter', 'Helvetica Neue', 'sans-serif'],
        'serif': ['Lora', 'Times New Roman', 'serif'],
        'mono': ['Space Mono', 'SF Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}