/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#10B981",       // Emerald
          moderate: "#F59E0B",  // Amber
          high: "#F97316",      // Orange
          critical: "#EF4444",  // Crimson
          site: "#2563EB",      // Royal Blue
        }
      }
    },
  },
  plugins: [],
}
