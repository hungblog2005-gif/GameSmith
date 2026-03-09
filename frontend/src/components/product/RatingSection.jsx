import { useState, useEffect } from "react"
import RatingSummary from "./RatingSummary"
import RatingInput from "./RatingInput"
import RatingList from "./RatingList"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

/**
 * RatingSection Component
 * Tổng hợp tất cả rating components (Summary, Input, List)
 * Sử dụng trong ProductDetail page
 */
export default function RatingSection({
  productId = "",
  currentUserId = null,
  token = null,
  canUserRate = false,
  onRatingSuccess = () => {},
}) {
  const [reviews, setReviews] = useState([])
  const [ratingStats, setRatingStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    breakdown: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
    reviews: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [_isDeletingReviewId, setIsDeletingReviewId] = useState(null)

  // Load rating stats
  useEffect(() => {
    if (!productId) return

    setIsLoading(true)
    fetch(`${API_BASE}/reviews/asset/${productId}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setRatingStats(data)
          setReviews(data.reviews || [])
        }
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [productId])

  const handleSubmitRating = async (ratingData) => {
    if (!token || !productId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assetId: productId,
          ...ratingData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.message || "Gửi đánh giá thất bại")
        return
      }

      const newReview = await response.json()

      // Reload stats
      const statsResponse = await fetch(`${API_BASE}/reviews/asset/${productId}/stats`)
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setRatingStats(stats)
        setReviews(stats.reviews || [])
      }

      onRatingSuccess(newReview)
    } catch (error) {
      console.error("Rating error:", error)
      alert("Lỗi khi gửi đánh giá")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!token) return

    setIsDeletingReviewId(reviewId)
    try {
      const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        alert("Xóa đánh giá thất bại")
        return
      }

      // Remove from list
      setReviews((prev) => prev.filter((r) => r._id !== reviewId))

      // Reload stats
      const statsResponse = await fetch(`${API_BASE}/reviews/asset/${productId}/stats`)
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setRatingStats(stats)
        setReviews(stats.reviews || [])
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Lỗi khi xóa đánh giá")
    } finally {
      setIsDeletingReviewId(null)
    }
  }

  const handleHelpfulReview = async (reviewId, isHelpful) => {
    // This would require a backend endpoint to mark helpful
    // For now, we can just update local state
    console.log(`Review ${reviewId} marked as ${isHelpful ? "helpful" : "not helpful"}`)
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <RatingSummary
        averageRating={ratingStats.average_rating}
        totalReviews={ratingStats.total_reviews}
        breakdown={ratingStats.breakdown}
      />

      {/* Rating Input */}
      <RatingInput
        onSubmit={handleSubmitRating}
        isSubmitting={isSubmitting}
        canRate={canUserRate}
        disabled={isSubmitting}
      />

      {/* Rating List */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Tất cả đánh giá
        </h3>
        <RatingList
          reviews={reviews}
          currentUserId={currentUserId}
          onDelete={handleDeleteReview}
          onHelpful={handleHelpfulReview}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
