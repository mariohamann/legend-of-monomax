/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      'code': `"VT323", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
    },
    colors: {
      'primary': '#1F0E1C',
      'secondary': '#F5EDBA',
      'shade': '#8C8FAE',
    },
    extend: {
    },
  },
  plugins: [],
}
