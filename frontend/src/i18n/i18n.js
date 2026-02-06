import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import viVN from "./locales/vi.json"
import enUS from "./locales/en.json"

const resources = {
  vi: { translation: viVN },
  en: { translation: enUS },
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "vi",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
