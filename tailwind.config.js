const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  corePlugins: {
    fontStyle: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist_400Regular'],
        geist: ['Geist_400Regular'],
        'geist-medium': ['Geist_500Medium'],
        'geist-semibold': ['Geist_600SemiBold'],
        'geist-bold': ['Geist_700Bold'],
        'geist-extrabold': ['Geist_800ExtraBold'],
        fraunces: ['Fraunces_400Regular_Italic'],
        madimi: ['MadimiOne_400Regular'],
      },
      colors: {
        page: '#fafaf7',
        soft: '#f5f4ef',
        cream: '#F3EBDD',
        paper: '#ffffff',
        ink: '#141413',
        brand: {
          DEFAULT: '#FF6B1A',
          dark: '#c2410c',
          tint: '#FFF1E8',
        },
        explorer: '#0F6E56',
        connector: '#534AB7',
        curator: '#BA7517',
        creator: '#D4537E',
        verified: '#2B8FD9',
        error: '#EF4444',
        success: {
          DEFAULT: '#15803D',
          tint: '#DCFCE7',
        },
        disabled: '#D9D9D9',
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.italic': {
          fontFamily: 'Fraunces_400Regular_Italic',
        },
        '.not-italic': {
          fontFamily: 'Geist_400Regular',
        },
      });
    }),
  ],
};
