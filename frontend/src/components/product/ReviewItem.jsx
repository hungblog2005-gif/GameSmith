import { Trash2, Edit2, ThumbsUp, Loader2 } from "lucide-react"
import { useState } from "react"
import RatingStars from "./RatingStars"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

/**
 * ReviewItem Component
 * Hiện một review
 */
export default function ReviewItem({
  review,
  currentUserId,
  token,
  onDelete,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editComment, setEditComment] = useState(review.comment || "")
  const [editRating, setEditRating] = useState(review.rating)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0)

  const isOwner = review.user._id === currentUserId

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return

    setIsDeleting(true)
    try {
      const response = await fetch(`${API_BASE}/reviews/${review._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete review")
      onDelete(review._id)
    } catch (error) {
      alert("Không thể xóa đánh giá")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/reviews/${review._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment.trim() || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to update review")
      const updated = await response.json()
      setIsEditing(false)
      onUpdate(updated)
    } catch (error) {
      alert("Không thể cập nhật đánh giá")
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkHelpful = async () => {
    try {
      // Giả sử có endpoint để mark helpful
      setHelpfulCount((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to mark helpful")
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div>
          <label className="text-sm font-medium block mb-2">Đánh giá:</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setEditRating(star)}
                className="text-xl cursor-pointer"
              >
                {star <= editRating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={editComment}
          onChange={(e) => setEditComment(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsEditing(false)
              setEditComment(review.comment || "")
              setEditRating(review.rating)
            }}
            className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="flex-1 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-3">
            {review.user.avatar_url && (
              <img
                src={review.user.avatar_url}
                alt={review.user.username}
                className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800"
              />
            )}
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {review.user.username}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
              </p>
            </div>
          </div>

          {/* Rating */}
          <RatingStars rating={review.rating} size={14} />

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              {review.comment}
            </p>
          )}

          {/* Helpful button */}
          <button
            onClick={handleMarkHelpful}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 mt-2"
          >
            <ThumbsUp size={12} />
            Hữu ích ({helpfulCount})
          </button>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              title="Chỉnh sửa"
            >
              <Edit2 size={16} className="text-zinc-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
              title="Xóa"
            >
              {isDeleting ? (
                <Loader2 size={16} className="text-red-600 animate-spin" />
              ) : (
                <Trash2 size={16} className="text-red-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
