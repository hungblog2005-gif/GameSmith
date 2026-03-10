import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard, Users, Package, ShoppingBag,
  FolderTree, LogOut, Shield,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import ThemeToggle from "../components/ui/ThemeToggle"

const NAV_ITEMS = [
  { to: "/admin", labelKey: "admin.layout.nav.dashboard", icon: LayoutDashboard, end: true, roles: ["admin", "moderator"] },
  { to: "/admin/users", labelKey: "admin.layout.nav.users", icon: Users, roles: ["admin"] },
  { to: "/admin/assets", labelKey: "admin.layout.nav.assets", icon: Package, roles: ["admin", "moderator"] },
  { to: "/admin/orders", labelKey: "admin.layout.nav.orders", icon: ShoppingBag, roles: ["admin", "moderator"] },
  { to: "/admin/categories", labelKey: "admin.layout.nav.categories", icon: FolderTree, roles: ["admin"] },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user?.role))

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">
            GameSmith Admin
          </span>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{t("admin.layout.signedInAs")}</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user?.username}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            user?.role === "admin"
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          }`}>
            {user?.role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition font-medium ${
                  isActive
                    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <LogOut size={15} />
            {t("admin.layout.logout")}
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
