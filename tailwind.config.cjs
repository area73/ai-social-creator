// Este archivo debe ser .cjs porque package.json usa "type": "module"
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}", "./public/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [],
};
