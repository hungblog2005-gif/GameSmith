import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { Menu, Package } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import UserMenu from "./UserMenu"

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          <Menu size={24} className="text-zinc-700 dark:text-zinc-300" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="font-semibold text-xl tracking-tight hover:opacity-80 transition text-zinc-900 dark:text-white"
        >
          {t("navbar.gameSmith")}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/orders")}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          <Package size={20} />
          <span>{t("navbar.orders")}</span>
        </button>
        <UserMenu />
        <ThemeToggle />
      </div>
    </header>
  )
}
