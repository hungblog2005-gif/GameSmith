import { useTranslation } from "react-i18next"

export default function ProductDescription({ description }) {
  const { t } = useTranslation()

  return (
    <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        {t("productDetail.description")}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
  )
}
