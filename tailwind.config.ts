import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        umblue: '#003366',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;

