import ThemeToggle from "./ThemeToggle"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
      <h1 className="font-bold text-lg">GameSmith</h1>
      <ThemeToggle />
    </header>
  )
}
