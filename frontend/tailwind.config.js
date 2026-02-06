export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0062ff",
        surface: {
          DEFAULT: "#ffffff",
          dark: "#18181b",
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
}
