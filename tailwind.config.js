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
          DEFAULT: '#142B4A',
          50: '#E8EDF4',
          100: '#D1DBE9',
          200: '#A3B7D3',
          300: '#7593BD',
          400: '#476FA7',
          500: '#194B91',
          600: '#142B4A',
          700: '#0F2238',
          800: '#0A1826',
          900: '#050C13',
        },
        secondary: {
          DEFAULT: '#2563EB',
          50: '#EBF2FE',
          100: '#D7E5FD',
          200: '#AFCBFB',
          300: '#87B1F9',
          400: '#5F97F7',
          500: '#2563EB',
          600: '#1E4FBC',
          700: '#163B8D',
          800: '#0F285E',
          900: '#07142F',
        },
        accent: {
          DEFAULT: '#14B8A6',
          50: '#E6F7F5',
          100: '#CCEFEB',
          200: '#99DFD7',
          300: '#66CFC3',
          400: '#33BFAF',
          500: '#14B8A6',
          600: '#109385',
          700: '#0C6E64',
          800: '#084A42',
          900: '#042521',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
