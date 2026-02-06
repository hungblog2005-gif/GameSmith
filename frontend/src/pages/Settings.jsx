import { useTranslation } from "react-i18next"
import { useLanguage } from "../context/LanguageContext"
import { useTheme } from "../context/ThemeContext"
import { Globe, Monitor, Check } from "lucide-react"

export default function Settings() {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2 text-zinc-900 dark:text-white tracking-tight">
        {t("settings.settings")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-12">
        Manage your preferences and account settings
      </p>

      {/* Language Settings */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Globe size={20} className="text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {t("settings.language")}
          </h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => changeLanguage("vi")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
              currentLanguage === "vi"
                ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            <span className={`font-medium ${
              currentLanguage === "vi"
                ? "text-white dark:text-zinc-900"
                : "text-zinc-900 dark:text-white"
            }`}>
              {t("settings.vietnamese")}
            </span>
            {currentLanguage === "vi" && (
              <Check size={18} className="text-white dark:text-zinc-900" />
            )}
          </button>

          <button
            onClick={() => changeLanguage("en")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
              currentLanguage === "en"
                ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            <span className={`font-medium ${
              currentLanguage === "en"
                ? "text-white dark:text-zinc-900"
                : "text-zinc-900 dark:text-white"
            }`}>
              {t("settings.english")}
            </span>
            {currentLanguage === "en" && (
              <Check size={18} className="text-white dark:text-zinc-900" />
            )}
          </button>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Monitor size={20} className="text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {t("settings.appearance")}
          </h2>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
        >
          <span className="text-zinc-900 dark:text-white font-medium">
            {theme === "light" ? t("settings.lightMode") : t("settings.darkMode")}
          </span>
          <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
            {theme === "light" ? "Light" : "Dark"}
          </div>
        </button>
      </div>
    </div>
  )
}
