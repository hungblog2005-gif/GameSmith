import { useTranslation } from "react-i18next"

export default function ProductDescription({ description }) {
  const { t } = useTranslation()

  return (
    <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-3">
        {t("productDetail.description", "Mô Tả")}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}
