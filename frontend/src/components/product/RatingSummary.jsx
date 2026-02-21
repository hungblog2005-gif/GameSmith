import { Star } from "lucide-react"

/**
 * RatingSummary Component
 * Hiển thị rating summary giống Google Play Store
 */
export default function RatingSummary({
  averageRating = 0,
  totalReviews = 0,
  breakdown = {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  },
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="grid md:grid-cols-[auto_1fr] gap-8">
        {/* Left: Average Rating */}
        <div className="flex flex-col items-center md:items-start justify-center min-w-[140px]">
          <div className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex gap-0.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                className={`${
                  i < Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            {totalReviews.toLocaleString()} {totalReviews === 1 ? "đánh giá" : "đánh giá"}
          </p>
        </div>

        {/* Right: Breakdown Bars */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const item = breakdown[stars] || { count: 0, percentage: 0 }
            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {stars}
                  </span>
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                </div>

                <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="text-right min-w-[2.5rem]">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
