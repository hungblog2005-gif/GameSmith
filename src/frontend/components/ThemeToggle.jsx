import { useTheme } from "../context/ThemeContext"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-zinc-700 dark:text-yellow-500" />
      ) : (
        <Moon size={20} className="text-zinc-700 dark:text-zinc-300" />
      )}
    </button>
  )
}
