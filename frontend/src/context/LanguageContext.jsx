import { createContext, useContext } from "react"
import { useTranslation } from "react-i18next"

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation()

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem("language", lang)
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage: i18n.language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
