/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#101626',
          800: '#161e33',
          750: '#1d2742',
          700: '#263456',
        },
        sports: {
          red: '#ef4444',
          green: '#10b981',
          gold: '#f59e0b',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 35s linear infinite',
        'score-flash': 'scoreFlash 1.5s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.2))' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scoreFlash: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.35)', transform: 'scale(1.08)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
