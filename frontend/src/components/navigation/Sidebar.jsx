import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import {
  Home,
  ShoppingBag,
  Grid3x3,
  Heart,
  Download,
  Package,
  MessageSquare,
  User,
  Settings,
  ChevronDown,
  X,
  Search,
} from "lucide-react"

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [expandedCategories, setExpandedCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const MENU_ITEMS = [
    { id: "home", label: t("sidebar.home"), icon: Home, path: "/" },
    { id: "browse", label: t("sidebar.browseAll"), icon: ShoppingBag, path: "/" },
    { id: "categories", label: t("sidebar.categories"), icon: Grid3x3, hasSubmenu: true },
    { id: "wishlist", label: t("sidebar.wishlist"), icon: Heart, path: "/wishlist" },
    { id: "downloads", label: t("sidebar.downloads"), icon: Download, path: "/downloads" },
    { id: "messages", label: t("sidebar.messages"), icon: MessageSquare, path: "/messages" },
    { id: "profile", label: t("sidebar.profile"), icon: User, path: "/profile" },
    { id: "settings", label: t("sidebar.settings"), icon: Settings, path: "/settings" },
  ]

  const CATEGORIES = [
    { id: "all", label: t("sidebar.allAssets") },
    { id: "2d", label: t("sidebar.2dAssets") },
    { id: "3d", label: t("sidebar.3dAssets") },
    { id: "ui", label: t("sidebar.uiKits") },
    { id: "audio", label: t("sidebar.audio") },
    { id: "vfx", label: t("sidebar.vfx") },
  ]

  const handleNavigate = (path) => {
    navigate(path)
    onClose?.()
  }

  const toggleCategories = () => {
    setExpandedCategories(!expandedCategories)
  }

  const filteredMenuItems = MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 h-full flex flex-col">
          {/* Sidebar Header with Close Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
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
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {user.name}
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
              className="w-full pl-10 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon

              if (item.hasSubmenu) {
                return (
                  <div key={item.id}>
                    <button
                      onClick={toggleCategories}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-zinc-500 dark:text-zinc-400" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-zinc-400 transition-transform duration-300 ${
                          expandedCategories ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Submenu */}
                    {expandedCategories && (
                      <div className="ml-3 mt-1 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              navigate("/")
                              onClose?.()
                            }}
                            className="block w-full text-left text-sm px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
      </aside>
    </>
  )
}
