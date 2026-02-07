import { useTranslation } from "react-i18next"

export default function RatingSection({ rating, reviewCount, breakdown }) {
  const { t } = useTranslation()

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <div className="flex flex-wrap gap-x-10 gap-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {rating}
          </p>
          <div className="flex gap-0.5 text-zinc-400">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(rating) ? "text-zinc-900 dark:text-zinc-100" : ""}>
                ★
              </span>
            ))}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("productDetail.reviewCount", { count: reviewCount })}
          </p>
        </div>

        <div className="grid min-w-[220px] flex-1 grid-cols-[34px_1fr_50px] items-center gap-y-3 gap-x-3">
          {breakdown.slice(0, 4).map((item, index) => (
            <div key={index} className="contents">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                {t("productDetail.starLabel", { stars: item.stars })}
              </p>
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${item.percentage}%` }}></div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-right">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
