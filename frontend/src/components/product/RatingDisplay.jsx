import { Star } from "lucide-react"
import RatingStars from "./RatingStars"

/**
 * RatingDisplay Component
 * Hiện thông tin rating breakdown
 */
export default function RatingDisplay({
  averageRating = 0,
  totalReviews = 0,
  breakdown = {},
  onViewReviews,
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Đánh giá từ khách hàng
          </h3>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                {averageRating}
              </div>
              <div className="mt-1">
                <RatingStars rating={averageRating} size={18} />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {totalReviews} {totalReviews === 1 ? "đánh giá" : "đánh giá"}
              </p>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const item = breakdown[stars] || { count: 0, percentage: 0 }
                return (
                  <div key={stars} className="grid grid-cols-[40px_1fr_50px] items-center gap-3">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {stars} ★
                    </span>
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-yellow-400"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onViewReviews && (
          <button
            onClick={onViewReviews}
            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            Xem tất cả đánh giá
          </button>
        )}
      </div>
    </div>
  )
}
