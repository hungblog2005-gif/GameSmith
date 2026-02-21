import { Star, ThumbsUp, Trash2, MoreVertical } from "lucide-react"
import { useState } from "react"

/**
 * RatingItem Component
 * Hiển thị một review item (kiểu Google Play)
 */
export default function RatingItem({
  review = {},
  currentUserId = null,
  onDelete = () => {},
  onHelpful = () => {},
  isDeleting = false,
  isOwner = false,
}) {
  const {
    _id = "",
    user = { username: "Anonymous", avatar_url: "" },
    rating = 0,
    comment = "",
    createdAt = null,
    helpful_count = 0,
    is_verified = false,
  } = review

  const [isHelpful, setIsHelpful] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hôm nay"
    if (diffDays === 1) return "Hôm qua"
    if (diffDays < 7) return `${diffDays} ngày trước`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
    return date.toLocaleDateString("vi-VN")
  }

  const handleHelpful = () => {
    setIsHelpful(!isHelpful)
    onHelpful(_id, !isHelpful)
  }

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      onDelete(_id)
    }
  }

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 py-4 last:border-b-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <img
            src={user.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username}
            alt={user.username}
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"
          />

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {user.username}
              </span>
              {is_verified && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                  Mua thực tế
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatDate(createdAt)}
            </p>
          </div>
        </div>

        {/* Menu */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-zinc-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 min-w-[150px]">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 first:rounded-t-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      {comment && (
        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-3">
          {comment}
        </p>
      )}

      {/* Footer Actions */}
      <button
        onClick={handleHelpful}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          isHelpful
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        <ThumbsUp
          size={16}
          className={isHelpful ? "fill-current" : ""}
        />
        Hữu ích {helpful_count + (isHelpful ? 1 : 0) > 0 && `(${helpful_count + (isHelpful ? 1 : 0)})`}
      </button>
    </div>
  )
}
