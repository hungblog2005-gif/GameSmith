import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { LogOut, User, LogIn, UserPlus } from "lucide-react"

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const menuRef = useRef(null)

  // Close menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/")
    setIsOpen(false)
  }

  const handleNavigate = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  // Nếu đã login
  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="hidden sm:inline text-sm font-medium text-zinc-900 dark:text-white">
            {user.name}
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-2 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => handleNavigate("/profile")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              <User size={18} />
              <span>{t("navbar.myProfile")}</span>
            </button>

            <div className="border-t border-zinc-200 dark:border-zinc-700" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <LogOut size={18} />
              <span>{t("navbar.logout")}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Nếu chưa login
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {t("navbar.account")}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-2 z-50">
          <button
            onClick={() => handleNavigate("/login")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
          >
            <LogIn size={18} />
            <span>{t("navbar.login")}</span>
          </button>

          <button
            onClick={() => handleNavigate("/signup")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
          >
            <UserPlus size={18} />
            <span>{t("navbar.signup")}</span>
          </button>
        </div>
      )}
    </div>
  )
}
