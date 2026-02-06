export default function RatingSection({ rating, reviewCount, breakdown }) {
  return (
    <div className="flex flex-col gap-4 p-4 mt-2">
      <div className="flex flex-wrap gap-x-8 gap-y-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* Overall Rating */}
        <div className="flex flex-col gap-2">
          <p className="text-slate-900 dark:text-slate-100 text-4xl font-black leading-tight">
            {rating}
          </p>
          <div className="flex gap-0.5 text-primary">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(rating) ? "filled-icon" : ""}>
                ★
              </span>
            ))}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
            {reviewCount} {reviewCount === 1 ? "đánh giá" : "đánh giá"}
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="grid min-w-[200px] flex-1 grid-cols-[30px_1fr_50px] items-center gap-y-3 gap-x-2">
          {breakdown.slice(0, 3).map((item, index) => (
            <div key={index} className="contents">
              <p className="text-slate-600 dark:text-slate-300 text-xs font-medium text-center">{item.stars}★</p>
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="rounded-full bg-primary" style={{ width: `${item.percentage}%` }}></div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal text-right">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
