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
          50: '#E8F4FD',
          100: '#C5E3FA',
          200: '#8FC8F5',
          300: '#59ADEF',
          400: '#2E96E6',
          500: '#0078D4',
          600: '#006CBE',
          700: '#005BA0',
          800: '#004A82',
          900: '#003964',
          DEFAULT: '#0078D4',
        },
        win11: {
          bg: '#F3F3F3',
          surface: '#FFFFFF',
          'surface-hover': '#F9F9F9',
          sidebar: 'rgba(255, 255, 255, 0.7)',
          border: '#E5E5E5',
          'border-strong': '#D1D1D1',
          text: '#1A1A1A',
          'text-secondary': '#616161',
          'text-tertiary': '#9E9E9E',
          divider: '#E0E0E0',
          'card-bg': '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'win': '8px',
        'win-lg': '12px',
        'win-xl': '16px',
      },
      boxShadow: {
        'win': '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 2px rgba(0, 0, 0, 0.06)',
        'win-md': '0 4px 16px rgba(0, 0, 0, 0.08), 0 0 2px rgba(0, 0, 0, 0.06)',
        'win-lg': '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 2px rgba(0, 0, 0, 0.06)',
        'win-card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      },
      backdropBlur: {
        'acrylic': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
