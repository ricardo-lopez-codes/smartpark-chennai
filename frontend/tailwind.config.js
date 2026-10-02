/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFD21F',
          yellowHover: '#E5B800',
          dark: '#171717',
          gray: '#666666',
          bgLight: '#F7F7F7',
          card: '#FFFFFF'
        },
        parking: {
          available: '#10B981', // green
          occupied: '#EF4444',  // red
          reserved: '#F59E0B',  // yellow/orange
          user: '#2563EB',      // blue
          unavailable: '#9CA3AF'// gray
        }
      }
    },
  },
  plugins: [],
}
