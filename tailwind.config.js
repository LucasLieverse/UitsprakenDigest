/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:       '#2081C3',
          terracotta: '#A63D33',
          darkred:    '#73241D',
          olive:      '#C0BDA5',
          darkgray:   '#262626',
          lightgray:  '#D9D9D9',
          bg:         '#F3F4F6',
          'bg-soft':  '#F5F5F5',
          'bg-gray':  '#F9FAFB',
          'bg-blue':  '#EFF6FB',
          'bg-red':   '#FDF3F2',
          white:      '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        brand: '12px',
      },
      boxShadow: {
        brand:        '3px 4px 12px rgba(0,0,0,0.12)',
        'brand-hover':'4px 6px 16px rgba(0,0,0,0.16)',
        soft:         '0 1px 2px rgba(0,0,0,0.05)',
      },
      transitionTimingFunction: {
        'brand-out': 'cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:            { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideInFromBottom: { '0%': { opacity: '0', transform: 'translateY(1rem)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideInFromBottom 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
