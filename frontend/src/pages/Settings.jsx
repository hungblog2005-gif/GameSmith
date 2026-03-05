import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLanguage } from "../context/LanguageContext"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { Globe, Monitor, Check, Lock, Eye, EyeOff } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Settings() {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordStatus, setPasswordStatus] = useState(null) // null | 'loading' | 'success' | string(error)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordStatus("Passwords do not match")
      return
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordStatus("New password must be at least 6 characters")
      return
    }
    setPasswordStatus("loading")
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE}/users/username/${user.username}/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      })
      if (res.status === 204) {
        setPasswordStatus("success")
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" })
      } else {
        const data = await res.json().catch(() => ({}))
        setPasswordStatus(data.message || "Failed to change password")
      }
    } catch {
      setPasswordStatus("Something went wrong")
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100 tracking-tight">
        {t("settings.settings")}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
        Manage your preferences and account settings
      </p>

      {/* Language Settings */}
      <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t("settings.language")}
          </h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => changeLanguage("vi")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
              currentLanguage === "vi"
                ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
            }`}
          >
            <span className={`font-medium ${
              currentLanguage === "vi"
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-700 dark:text-zinc-300"
            }`}>
              {t("settings.vietnamese")}
            </span>
            {currentLanguage === "vi" && (
              <Check size={18} className="text-zinc-900 dark:text-zinc-100" />
            )}
          </button>

          <button
            onClick={() => changeLanguage("en")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
              currentLanguage === "en"
                ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
            }`}
          >
            <span className={`font-medium ${
              currentLanguage === "en"
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-700 dark:text-zinc-300"
            }`}>
              {t("settings.english")}
            </span>
            {currentLanguage === "en" && (
              <Check size={18} className="text-zinc-900 dark:text-zinc-100" />
            )}
          </button>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={20} className="text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t("settings.appearance")}
          </h2>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 transition-all group"
        >
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">
            {theme === "light" ? t("settings.lightMode") : t("settings.darkMode")}
          </span>
          <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
            {theme === "light" ? "Light" : "Dark"}
          </div>
        </button>
      </div>

      {/* Change Password */}
      <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={20} className="text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: "current_password", label: "Current Password", show: "current" },
            { key: "new_password", label: "New Password", show: "new" },
            { key: "confirm_password", label: "Confirm New Password", show: "confirm" },
          ].map(({ key, label, show }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPasswords[show] ? "text" : "password"}
                  value={passwordForm[key]}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, [key]: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, [show]: !prev[show] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPasswords[show] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          {passwordStatus && passwordStatus !== "loading" && (
            <p className={`text-sm ${passwordStatus === "success" ? "text-green-500" : "text-red-500"}`}>
              {passwordStatus === "success" ? "Password changed successfully!" : passwordStatus}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordStatus === "loading"}
            className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {passwordStatus === "loading" ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
