/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        finroq: {
          ivory: '#F7F7F0',
          forest: '#173F2B',
          'forest-deep': '#102F21',
          'forest-light': '#1E4D36',
          white: '#FFFFFF',
          sage: '#DCE7D9',
          mint: '#EAF3E7',
          lime: '#C7F36B',
          text: '#202B24',
          muted: '#657168',
          border: '#E1E6DD',
          positive: '#247A50',
          warning: '#B77925',
          negative: '#B74747',
        },
        primary: {
          50: '#EAF3E7',
          100: '#DCE7D9',
          200: '#B8D1B2',
          300: '#8FB886',
          400: '#588E52',
          500: '#247A50',
          600: '#173F2B',
          700: '#133524',
          800: '#102F21',
          900: '#0B2016',
        },
        success: {
          50: '#f0fdf4',
          500: '#247A50',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#B77925',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#B74747',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};