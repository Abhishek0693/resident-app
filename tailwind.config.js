/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        niwas: {
          bg:       '#080808',
          surface:  '#101010',
          card:     '#181818',
          elevated: '#222222',
          border:   '#2C2C2C',
          line:     '#383838',
          text:     '#F0F0F0',
          muted:    '#888888',
          subtle:   '#444444',
          primary:  '#FFFFFF',
          inverse:  '#080808',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
