/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dde9ff',
          200: '#bcd2ff',
          300: '#90b1ff',
          400: '#5e87ff',
          500: '#3a63ff',
          600: '#2848ef',
          700: '#1f37c4',
          800: '#1d309b',
          900: '#1c2d7a',
        },
        accent: {
          400: '#a855f7',
          500: '#9333ea',
          600: '#7e22ce',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(120, 134, 255, 0.25), 0 18px 60px -12px rgba(58, 99, 255, 0.45)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
