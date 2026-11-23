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
        page: '#F7F3EC',
        soft: '#EFE9DF',
        cream: '#F3EBDD',
        paper: '#FFFDF9',
        card: '#FFFDF9',
        ink: '#1A1714',
        brand: {
          DEFAULT: '#1A1714',
          dark: '#000000',
          tint: '#F3F4F6',
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
        // Dark-mode palette (redesign "Home — dark mode"); use via dark:*-dk-*
        dk: {
          page: '#161412',
          card: '#211E1B',
          elevated: '#2A2622',
          select: '#3A352F',
          border: '#34302B',
          line: '#2E2A25',
          text: '#F7F3EC',
          body: '#CFC7BB',
          muted: '#A79E92',
          faint: '#8F877C',
          accent: '#E07A52',
        },
        gray: {
          50: '#F7F3EC',
          100: '#EFE9DF',
          200: '#E7E0D4',
          300: '#E2D9CA',
          400: '#9EA4AF',
          500: '#6C727F',
          600: '#4b4f57',
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
