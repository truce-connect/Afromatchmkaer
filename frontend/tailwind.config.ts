import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './context/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F4EF',
        primary: '#C65D3B',
        accent: '#C9A227',
        text: '#2B2B2B'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif']
      },
      boxShadow: {
        card: '0 20px 45px rgba(0,0,0,0.08)'
      },
      backgroundImage: {
        pattern: 'radial-gradient(circle at 1px 1px, rgba(201, 162, 39, 0.25) 1px, transparent 0)'
      }
    }
  },
  plugins: []
};

export default config;
