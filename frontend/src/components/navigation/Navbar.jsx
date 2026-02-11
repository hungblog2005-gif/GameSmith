import { useContext } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { CartContext } from "../../context/CartContext"
import { ArrowLeft, Menu, Package, ShoppingCart } from "lucide-react"
import ThemeToggle from "../ui/ThemeToggle"
import UserMenu from "./UserMenu"

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { cartCount } = useContext(CartContext)
  const showBackButton = location.pathname !== "/"

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
              aria-label={t("common.back")}
            >
              <ArrowLeft size={20} />
            </button>
          )}
        <button
          onClick={onMenuClick}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition"
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
          onClick={() => navigate("/my-product")}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          <Package size={20} />
          <span>{t("navbar.orders")}</span>
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="relative flex items-center justify-center p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
          aria-label="Shopping Cart"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs rounded-full flex items-center justify-center font-semibold">
              {cartCount}
            </span>
          )}
        </button>
        <UserMenu />
        <ThemeToggle />
      </div>
      </div>
    </header>
  )
}
