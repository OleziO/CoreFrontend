import type { Config } from 'tailwindcss'
import { colors } from './tailwind.colors'

const spacing = Array.from({ length: 400 }, (_, index) => index).map(index => `${index}px`)

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    screens: {
      '2xs': '450px',
      xs: '580px',
      xsl: '600px',
      sm: '640px',
      '2sm': '700px',
      md: '768px',
      '2md': '850px',
      lg: '992px',
      '2lg': '1000px',
      nm: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    colors,
    extend: {
      spacing,
      fontFamily: {
        inter: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/container-queries')
  ]
} satisfies Config
