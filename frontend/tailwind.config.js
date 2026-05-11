/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode using 'class' strategy
  darkMode: 'class',

  // Where Tailwind should scan for class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      // Custom color palette
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },

  plugins: [],
}