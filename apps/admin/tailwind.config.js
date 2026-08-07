/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#07090e',
        'bg-surface': '#0f172a',
        'bg-surface-elevated': '#1e293b',
        'accent-primary': '#3b82f6',
        'accent-secondary': '#6366f1',
        'accent-cyan': '#06b6d4',
        'accent-emerald': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-rose': '#f43f5e',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 25px rgba(59, 130, 246, 0.25)',
      }
    },
  },
  plugins: [],
}

