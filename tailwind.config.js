/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#1e3a5f",
          600: "#152a45",
          700: "#0f1f33",
        },
        accent: {
          500: "#e85d26",
          600: "#c94a1a",
        },
        success: {
          500: "#2e8b57",
          600: "#256e46",
        },
      },
    },
  },
  plugins: [],
};
