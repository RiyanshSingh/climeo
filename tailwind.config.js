/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eco-green': '#3B8B5D', // Base green
        'eco-green-light': '#84C98B', // Lighter green gradient top
        'eco-green-dark': '#2A6B45', // Darker green text/buttons
        'eco-bg': '#E6F4EA', // Light background green
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter for modern look
      }
    },
  },
  plugins: [],
}
