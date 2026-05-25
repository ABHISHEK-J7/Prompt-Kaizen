/** @type {import('tailwindcss').Config} */
// Palette uses ONLY colors confirmed to exist in Torii Minds' CSS
// (https://toriiminds.com). No invented shades.

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        flame: {
          50:  '#f5f5f5',
          100: '#e5e5e5',
          200: '#dee2e6',
          300: '#bababa',
          400: '#F15D49', // Torii coral
          500: '#F15D23', // BRAND anchor (Torii orange)
          600: '#F15D49',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
          950: '#121212',
        },
        cream: {
          50:  '#ffffff',
          100: '#FFFFFF', // BRAND anchor (pure white)
          200: '#f8f9fa',
          300: '#f5f5f5',
          400: '#e5e5e5',
          500: '#dee2e6',
          600: '#bababa',
          700: '#6c757d',
          800: '#495057',
          900: '#343a40',
        },
      },
      fontFamily: {
        sans: [
          'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(33, 37, 41, 0.18)',
        glow: '0 0 0 6px rgba(241, 93, 35, 0.18)',
        ring: '0 0 0 1px rgba(33, 37, 41, 0.06), 0 1px 2px rgba(33, 37, 41, 0.04)',
      },
      borderRadius: {
        '2xl': '1.1rem',
        '3xl': '1.6rem',
      },
      backgroundImage: {
        'grid-flame': "radial-gradient(circle at 1px 1px, rgba(33,37,41,0.06) 1px, transparent 0)",
        'mesh': 'radial-gradient(at 20% 10%, rgba(255,255,255,0.65) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255,255,255,0.35) 0px, transparent 50%), radial-gradient(at 0% 90%, rgba(255,255,255,0.50) 0px, transparent 60%)',
      },
      keyframes: {
        'fade-in':       { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'fade-in-up':    { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pop-in':        { '0%': { opacity: 0, transform: 'scale(0.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'float':         { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        'shimmer':       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-ring':    { '0%': { boxShadow: '0 0 0 0 rgba(241,93,35,0.6)' }, '100%': { boxShadow: '0 0 0 18px rgba(241,93,35,0)' } },
        'spin-slow':     { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in':    'fade-in 300ms ease-out both',
        'fade-in-up': 'fade-in-up 420ms ease-out both',
        'pop-in':     'pop-in 280ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both',
        'float':      'float 5s ease-in-out infinite',
        'shimmer':    'shimmer 2.2s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.66, 0, 0, 1) infinite',
        'spin-slow':  'spin-slow 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
