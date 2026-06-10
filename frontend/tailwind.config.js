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
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#8b5cf6', // Indigo-Purple core theme
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        darkBg: {
          DEFAULT: '#0f172a', // Slate-900
          card: '#1e293b',    // Slate-800
          border: '#334155',  // Slate-700
          text: '#94a3b8',    // Slate-400
        },
        // Nike AirVerse Colors
        'pulse-red': '#FF3B30',
        'platinum-gray': '#707072',
        'surface-dim': '#131313',
        'surface-container': '#1f1f1f',
        'surface-container-high': '#2a2a2a',
        'surface-container-low': '#1b1b1b',
        'surface-container-lowest': '#0e0e0e',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        'display-hero': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'button-text': ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
      },
      spacing: {
        gutter: '24px',
        'margin-desktop': '80px',
        unit: '8px',
        'margin-mobile': '24px',
        'container-max': '1440px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
