import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0d1117',
        card:    '#161b27',
        card2:   '#1c2333',
        border:  'rgba(255,255,255,0.07)',
        border2: 'rgba(255,255,255,0.13)',
        muted:   '#6b7280',
        muted2:  '#9ca3af',
        green:   '#22c97a',
        gold:    '#f5a623',
        accent:  '#4f8cff',
        danger:  '#ff4f4f',
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        bebas: ['Bebas Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
