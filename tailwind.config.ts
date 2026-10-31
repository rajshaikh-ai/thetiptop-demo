import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#C62828', dark: '#9F1D1D', soft: '#FDECEC' },
        ink: '#1F1A17',
        muted: '#6B6259',
        ground: '#FBF7F2',
        line: '#EDE6DD',
        sand: '#F3EDE5',
        veg: '#1E7B34',
        nonveg: '#B3261E',
        amber: '#B45309',
        admin: '#F4F1EC',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,26,23,0.06), 0 2px 8px rgba(31,26,23,0.04)',
        lift: '0 8px 24px rgba(198,40,40,0.30)',
      },
    },
  },
  plugins: [],
} satisfies Config;
