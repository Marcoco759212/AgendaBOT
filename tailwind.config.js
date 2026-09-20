/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0D14',
        panel: '#161B22',
        panelAlt: '#111827',
        accent: '#10B981',
        accentStrong: '#059669',
        violet: '#8B5CF6',
        violetStrong: '#6D28D9',
        line: '#1f2937',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(16,185,129,0.28), 0 18px 45px rgba(16,185,129,0.24)',
      },
      animation: {
        pulseSoft: 'pulse 2s ease-in-out infinite',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.12) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
}
