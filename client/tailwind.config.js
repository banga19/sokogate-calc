/**
 * Tailwind CSS Configuration
 * Reuses design tokens from the main application
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e293b',
          light: '#334155',
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          soft: '#fffbeb',
        },
        secondary: '#0ea5e9',
        success: '#10b981',
        warning: '#f97316',
        danger: '#ef4444',
        info: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
