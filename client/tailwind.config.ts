import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: { DEFAULT: '#F5F0E8', dark: '#EDE8DF' },
        forest:    { DEFAULT: '#2D5016', light: '#3D6B20', dark: '#4A7C2F' },
        gold:      { DEFAULT: '#C9A84C', dark: '#A88A3D' },
        bark:      { DEFAULT: '#2C1810', light: '#4A2C1A' },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Lora"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
