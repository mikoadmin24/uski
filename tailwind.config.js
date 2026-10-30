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
          DEFAULT: '#0060AE',
          dark: '#004C8C',
          light: '#237DCD',
        },
        canvas: '#000000',
        'surface-alt': '#2D3033',
        'on-primary': '#FFFFFF',
        ink: '#FFFFFF',
        body: '#5A6166',
        muted: '#2D3033',
        hairline: '#E3E4E5',
        'accent-1': '#71797F',
        'accent-2': '#FFCE3B',
        'neutral-1': '#C6C9CC',
        'neutral-2': '#F1F2F2',
        badge: {
          bg: '#F8E7E9',
          text: '#B91126',
        },
      },
      fontFamily: {
        urbanist: ['Urbanist', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '12px',
        md: '16px',
        full: '9999px',
      },
      boxShadow: {
        'icon-lift': 'rgba(50, 52, 55, 0.06) 0px 8px 12px 6px, rgba(50, 52, 55, 0.1) 0px 4px 36px 0px',
      },
      maxWidth: {
        'site': '1376px',
      },
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        'xxl': '32px',
        'xxxl': '48px',
        'section': '76px',
        'band': '96px',
      },
    },
  },
  plugins: [],
}
