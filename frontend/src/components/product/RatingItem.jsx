import { Star, ThumbsUp, Trash2, MoreVertical, ShieldCheck } from "lucide-react"
import { useState } from "react"

// Deterministic color palette for avatars based on username
const AVATAR_COLORS = [
  ["#6366f1", "#f1f5ff"], // indigo
  ["#ec4899", "#fdf2f8"], // pink
  ["#f59e0b", "#fffbeb"], // amber
  ["#10b981", "#ecfdf5"], // emerald
  ["#3b82f6", "#eff6ff"], // blue
  ["#8b5cf6", "#f5f3ff"], // violet
  ["#ef4444", "#fef2f2"], // red
  ["#06b6d4", "#ecfeff"], // cyan
]

function getAvatarColor(username = "") {
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function UserAvatar({ user, size = 44 }) {
  const [imgError, setImgError] = useState(false)
  const [bgColor, fgColor] = getAvatarColor(user.username)
  const initial = (user.username || "?")[0].toUpperCase()

  if (user.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username}
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-zinc-800"
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, background: bgColor, color: fgColor, fontSize: size * 0.42 }}
      className="rounded-full flex items-center justify-center flex-shrink-0 font-bold ring-2 ring-white dark:ring-zinc-800"
    >
      {initial}
    </div>
  )
}

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
    helpfulCount = 0,
    isVerifiedPurchase = false,
  } = review

  const [isHelpful, setIsHelpful] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
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
      setShowMenu(false)
    }
  }

  const displayHelpful = helpfulCount + (isHelpful ? 1 : 0)

  return (
    <div className="px-5 py-4 last:pb-5">
      <div className="flex gap-3.5">
        {/* Avatar */}
        <UserAvatar user={user} size={44} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: name + badge + menu */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {user.username}
              </span>
              {isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  <ShieldCheck size={11} />
                  Đã mua
                </span>
              )}
            </div>

            {/* 3-dot menu — only for owner */}
            {isOwner && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 -mr-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <MoreVertical size={18} className="text-zinc-400" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-20 min-w-[140px] overflow-hidden">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 text-sm disabled:opacity-50 transition-colors"
                      >
                        <Trash2 size={15} />
                        Xóa đánh giá
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stars + Date in same row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < rating ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {formatDate(createdAt)}
            </span>
          </div>

          {/* Comment */}
          {comment && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
              {comment}
            </p>
          )}

          {/* Helpful */}
          <button
            onClick={handleHelpful}
            className={`inline-flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-full border transition-all ${
              isHelpful
                ? "border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            <ThumbsUp size={13} className={isHelpful ? "fill-current" : ""} />
            Hữu ích{displayHelpful > 0 ? ` · ${displayHelpful}` : ""}
          </button>
        </div>
      </div>
    </div>
  )
}
