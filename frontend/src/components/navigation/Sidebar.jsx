import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import {
  Home,
  ShoppingBag,
  Heart,
  Download,
  Package,
  MessageSquare,
  User,
  Settings,
  X,
  Search,
  ShoppingCart,
} from "lucide-react"

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const MENU_ITEMS = [
    { id: "home", label: t("sidebar.home"), icon: Home, path: "/" },
    { id: "browse", label: t("sidebar.browseAll"), icon: ShoppingBag, path: "/browse-all" },
    { id: "cart", label: t("cart.title"), icon: ShoppingCart, path: "/cart" },
    { id: "wishlist", label: t("sidebar.wishlist"), icon: Heart, path: "/wishlist" },
    { id: "downloads", label: t("sidebar.downloads"), icon: Download, path: "/downloads" },
    { id: "my-product", label: t("sidebar.myProduct"), icon: Package, path: "/my-product" },
    { id: "messages", label: t("sidebar.messages"), icon: MessageSquare, path: "/messages" },
    { id: "profile", label: t("sidebar.profile"), icon: User, path: "/profile" },
    { id: "settings", label: t("sidebar.settings"), icon: Settings, path: "/settings" },
  ]

  const handleNavigate = (path) => {
    navigate(path)
    onClose?.()
  }

  const filteredMenuItems = MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AnimatePresence>
      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          key="sidebar-overlay"
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      {isOpen && (
      <motion.aside
        key="sidebar-panel"
        className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto z-50"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-6 space-y-6 h-full flex flex-col">
          {/* Sidebar Header with Close Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              {t("sidebar.menu")}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <X size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url || user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt={user.username || user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {user.username || user.name || "User"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder={t("sidebar.menu")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            />
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <Icon size={18} className="text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {t("sidebar.copyright")}
            </p>
          </div>
        </div>
      </motion.aside>
      )}
    </AnimatePresence>
  )
}
