import { useState } from "react"
import { Star, Send } from "lucide-react"

/**
 * RatingInput Component
 * Form để user đánh giá sản phẩm (kiểu Google Play)
 */
export default function RatingInput({
  onSubmit = () => {},
  isSubmitting = false,
  canRate = true,
  disabled = false,
}) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating === 0 || disabled) return

    onSubmit({
      rating,
      comment: comment.trim() || undefined,
    })

    // Reset form
    setRating(0)
    setComment("")
  }

  if (!canRate) {
    return null
  }

  const ratingLabels = {
    5: "Tuyệt vời!",
    4: "Rất tốt",
    3: "Bình thường",
    2: "Không tốt",
    1: "Tồi tệ",
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Bạn đánh giá sản phẩm này thế nào?
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={disabled}
                className="transition-transform hover:scale-125 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star
                  size={44}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {ratingLabels[rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        {rating > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Chia sẻ chi tiết về trải nghiệm của bạn
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bạn thích gì về sản phẩm này? Có gì cần cải thiện không?"
              maxLength={500}
              rows={4}
              disabled={disabled}
              className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                {comment.length}/500
              </span>
              {comment.length > 400 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  Còn {500 - comment.length} ký tự
                </span>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {rating > 0 && (
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        )}

        {!rating && (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Chọn số sao để bắt đầu đánh giá
          </p>
        )}
      </form>
    </div>
  )
}
