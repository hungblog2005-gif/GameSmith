import { useTranslation } from "react-i18next"
import { useLanguage } from "../context/LanguageContext"
import { useTheme } from "../context/ThemeContext"
import { Globe, Monitor, Check } from "lucide-react"

export default function Settings() {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()

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
    </div>
  )
}
