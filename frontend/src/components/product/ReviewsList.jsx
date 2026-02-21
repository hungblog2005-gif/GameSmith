import { useState, useEffect } from "react"
import ReviewItem from "./ReviewItem"
import { Loader2 } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

/**
 * ReviewsList Component
 * Hiện danh sách reviews với phân trang
 */
export default function ReviewsList({
  productId,
  initialReviews = [],
  currentUserId,
  token,
  sortBy = "newest",
  filterRating = "all",
}) {
  const [reviews, setReviews] = useState(initialReviews)
  const [loading, setLoading] = useState(!initialReviews.length)
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    if (initialReviews.length > 0) {
      setReviews(initialReviews)
      setLoading(false)
    }
  }, [initialReviews])

  const handleDelete = (reviewId) => {
    setReviews((prev) => prev.filter((r) => r._id !== reviewId))
  }

  const handleUpdate = (updated) => {
    setReviews((prev) =>
      prev.map((r) => (r._id === updated._id ? updated : r))
    )
  }

  // Filter and sort
  let filteredReviews = reviews
  if (filterRating !== "all") {
    filteredReviews = reviews.filter((r) => r.rating === parseInt(filterRating))
  }

  if (sortBy === "newest") {
    filteredReviews = [...filteredReviews].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  } else if (sortBy === "highest") {
    filteredReviews = [...filteredReviews].sort((a, b) => b.rating - a.rating)
  } else if (sortBy === "lowest") {
    filteredReviews = [...filteredReviews].sort((a, b) => a.rating - b.rating)
  }

  const displayedReviews = filteredReviews.slice(0, visibleCount)
  const hasMore = filteredReviews.length > visibleCount

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 dark:text-zinc-400">
          Chưa có đánh giá nào cho sản phẩm này
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayedReviews.map((review) => (
        <ReviewItem
          key={review._id}
          review={review}
          currentUserId={currentUserId}
          token={token}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => setVisibleCount((prev) => prev + 5)}
          className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
        >
          Tải thêm ({filteredReviews.length - displayedReviews.length})
        </button>
      )}
    </div>
  )
}
