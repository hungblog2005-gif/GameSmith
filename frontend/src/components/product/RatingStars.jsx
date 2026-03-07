import { Star } from "lucide-react"

/**
 * RatingStars Component
 * Hiện rating từ 1-5 sao
 * Props:
 *   - rating: số sao (1-5)
 *   - size: kích thước sao (số pixel)
 *   - fillColor: màu sao đã cho điểm (default: text-yellow-400)
 *   - emptyColor: màu sao chưa cho điểm (default: text-gray-300)
 *   - interactive: cho phép click để chọn rating (default: false)
 *   - onRatingChange: callback khi rating thay đổi
 */
export default function RatingStars({
  rating = 0,
  size = 16,
  fillColor = "text-yellow-400",
  emptyColor = "text-gray-300 dark:text-gray-600",
  interactive = false,
  onRatingChange = null,
}) {
  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue)
    }
  }

  return (
    <div className={`flex gap-1 ${interactive ? "cursor-pointer" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleStarClick(star)}
          disabled={!interactive}
          className={`transition-colors ${interactive ? "hover:opacity-80" : ""}`}
        >
          <Star
            size={size}
            className={star <= Math.ceil(rating) ? fillColor : emptyColor}
            fill={star <= Math.ceil(rating) ? "currentColor" : "none"}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
