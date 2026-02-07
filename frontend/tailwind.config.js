export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        surface: {
          DEFAULT: "#ffffff",
          dark: "#18181b",
        },
        muted: {
          DEFAULT: "#f4f4f5",
          dark: "#27272a",
        },
      },
      boxShadow: {
        soft: "0 2px 12px -4px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
}
