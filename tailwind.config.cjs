// This file must be .cjs because package.json uses "type": "module"
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}", "./public/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [],
};
