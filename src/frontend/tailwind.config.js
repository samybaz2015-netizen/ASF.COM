/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mainColor: "rgba(42, 56, 91, 1)",
        secondaryColor: "rgba(188, 145, 92, 1)",
        hoverColor: "rgba(188, 145, 92, 0.5)",
      },
    },
  },
  plugins: [],
};