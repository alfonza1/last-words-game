/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#39ff14',
          pink: '#ff2bd6',
          cyan: '#00f0ff',
          amber: '#ffb300',
          red: '#ff3860',
        },
        ink: {
          900: '#05080a',
          800: '#0a0f12',
          700: '#101820',
          600: '#16222b',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 12px rgba(57,255,20,0.6), 0 0 32px rgba(57,255,20,0.25)',
        'neon-pink': '0 0 12px rgba(255,43,214,0.6), 0 0 32px rgba(255,43,214,0.25)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '0.7' },
          '50%': { opacity: '0.3' },
          '55%': { opacity: '0.8' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-40px)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(57,255,20,0.5)' },
          '50%': { boxShadow: '0 0 24px rgba(57,255,20,0.9)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '20%': { transform: 'translate(-6px, 3px)' },
          '40%': { transform: 'translate(6px, -3px)' },
          '60%': { transform: 'translate(-5px, -2px)' },
          '80%': { transform: 'translate(5px, 2px)' },
        },
      },
      animation: {
        flicker: 'flicker 1.5s infinite',
        floatUp: 'floatUp 1s ease-out forwards',
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
        fadeIn: 'fadeIn 0.18s ease-out',
        shake: 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};
