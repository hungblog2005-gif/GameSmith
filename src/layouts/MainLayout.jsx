import Navbar from "../components/Navbar"
import Home from "../pages/Home"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <main className="p-6">
        <Home />
      </main>
    </div>
  )
}
