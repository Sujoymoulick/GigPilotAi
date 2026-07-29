/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#05080E',
        card: '#090D16',
        border: '#1E293B',
        purpleAccent: '#10B981',
        blueAccent: '#0D9488',
      },
      backgroundImage: {
        'purple-blue-gradient': 'linear-gradient(135deg, #10B981 0%, #0D9488 50%, #059669 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%)',
      },
    },
  },
  plugins: [],
};
