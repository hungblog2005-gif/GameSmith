import { useState, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import RatingItem from "./RatingItem"

/**
 * RatingList Component
 * Hiển thị danh sách reviews (kiểu Google Play)
 */
export default function RatingList({
  reviews = [],
  currentUserId = null,
  onDelete = () => {},
  onHelpful = () => {},
  isLoading = false,
}) {
  const [sortBy, setSortBy] = useState("newest") // newest, helpful, highest, lowest
  const [filterRating, setFilterRating] = useState("all") // all, 5, 4, 3, 2, 1
  const [itemsToShow, setItemsToShow] = useState(5)
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews]

    // Filter by rating
    if (filterRating !== "all") {
      result = result.filter((r) => r.rating === parseInt(filterRating))
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === "helpful") {
      result.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0))
    } else if (sortBy === "highest") {
      result.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === "lowest") {
      result.sort((a, b) => a.rating - b.rating)
    }

    return result
  }, [reviews, filterRating, sortBy])

  const displayedReviews = filteredReviews.slice(0, itemsToShow)
  const hasMore = filteredReviews.length > itemsToShow

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Đang tải đánh giá...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Hiển thị {displayedReviews.length} trên {filteredReviews.length} đánh giá
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Filter by Rating */}
          <div className="flex gap-2 flex-wrap">
            {["all", 5, 4, 3, 2, 1].map((rating) => {
              const label =
                rating === "all"
                  ? "Tất cả"
                  : `${rating} ⭐`

              return (
                <button
                  key={rating}
                  onClick={() => {
                    setFilterRating(rating === "all" ? "all" : rating.toString())
                    setItemsToShow(5)
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterRating === (rating === "all" ? "all" : rating.toString())
                      ? "bg-yellow-400 text-zinc-900"
                      : "bg-gray-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-gray-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-gray-300 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              Sắp xếp
              <ChevronDown size={14} className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 min-w-[160px]">
                {[
                  { value: "newest", label: "Mới nhất" },
                  { value: "helpful", label: "Hữu ích nhất" },
                  { value: "highest", label: "Cao nhất (5 sao)" },
                  { value: "lowest", label: "Thấp nhất (1 sao)" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortMenu(false)
                      setItemsToShow(5)
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value
                        ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
        {displayedReviews.map((review) => (
          <RatingItem
            key={review._id}
            review={review}
            currentUserId={currentUserId}
            isOwner={String(review.user?._id) === String(currentUserId)}
            onDelete={onDelete}
            onHelpful={onHelpful}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setItemsToShow((prev) => prev + 5)}
          className="w-full py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Tải thêm ({filteredReviews.length - displayedReviews.length})
        </button>
      )}
    </div>
  )
}
