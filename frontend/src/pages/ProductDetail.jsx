import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Share2, ShoppingCart, Loader2, ArrowLeft } from "lucide-react"
import { CartContext } from "../context/CartContext"
import { UserDataContext } from "../context/UserDataContext"
import { useAuth } from "../context/AuthContext"

// product components
import ProductCarousel from "../components/product/ProductCarousel"
import RatingSection from "../components/product/RatingSection"
import ProductDescription from "../components/product/ProductDescription"
import RelatedProducts from "../components/product/RelatedProducts"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addToCart } = useContext(CartContext)
  const { toggleWishlist, isInWishlist } = useContext(UserDataContext)
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedLicense, setSelectedLicense] = useState("personal")
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [wishlistSaved, setWishlistSaved] = useState(false)

  // Sync wishlist state when product loads
  useEffect(() => {
    if (productId) setWishlistSaved(isInWishlist(productId))
  }, [productId, isInWishlist])
  const [shareStatus, setShareStatus] = useState("")
  const [showReviews, setShowReviews] = useState(false)
  const [reviewFilter, setReviewFilter] = useState("all")
  const [visibleReviews, setVisibleReviews] = useState(3)

  // Fetch product, reviews, related
  useEffect(() => {
    if (!productId) return
    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`${API_BASE}/assets/${productId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/reviews/asset/${productId}`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/assets/${productId}/related?limit=6`).then(r => r.ok ? r.json() : []),
    ]).then(([asset, revs, related]) => {
      if (!asset) {
        setError("notFound")
        return
      }
      setProduct(asset)
      setReviews(revs)
      setRelatedProducts((related || []).map(a => ({
        id: a._id,
        title: a.title,
        price: a.is_free ? 0 : (a.discount_percentage > 0 ? a.price * (1 - a.discount_percentage / 100) : a.price),
        image: a.thumbnail_url ? (a.thumbnail_url.startsWith("/") ? `${API_BASE}${a.thumbnail_url}` : a.thumbnail_url) : "https://placehold.co/400x400?text=No+Image",
      })))
      // Set default format
      if (asset.file_format?.length > 0) {
        setSelectedFormat(asset.file_format[0])
      }
      // Increment views
      fetch(`${API_BASE}/assets/${productId}/view`, { method: "POST" }).catch(() => {})
    }).catch(() => setError("networkError"))
      .finally(() => setLoading(false))
  }, [productId])

  // Build images array from product
  const getImages = () => {
    if (!product) return []
    const images = []
    if (product.thumbnail_url) {
      const url = product.thumbnail_url.startsWith("/") ? `${API_BASE}${product.thumbnail_url}` : product.thumbnail_url
      images.push(url)
    }
    if (product.preview_images?.length > 0) {
      product.preview_images.forEach(img => {
        const url = img.startsWith("/") ? `${API_BASE}${img}` : img
        images.push(url)
      })
    }
    if (images.length === 0) {
      images.push("https://placehold.co/800x450?text=No+Image")
    }
    return images
  }

  // Rating calculations from real reviews
  const buildRatingBreakdown = () => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++ })
    const total = reviews.length
    return [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: counts[stars],
      percentage: total > 0 ? Math.round((counts[stars] / total) * 100) : 0,
    }))
  }

  const ratingBreakdown = buildRatingBreakdown()
  const totalReviewCount = reviews.length
  const averageRating = totalReviewCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewCount).toFixed(1)
    : product?.ratings_average?.toFixed(1) || "0.0"

  // Filter reviews
  const filteredReviews = reviewFilter === "all"
    ? reviews
    : reviews.filter(r => r.rating === reviewFilter)
  const visibleReviewList = filteredReviews.slice(0, visibleReviews)
  const filteredTotal = filteredReviews.length

  // Price calculations
  const getDiscountedPrice = () => {
    if (!product) return 0
    if (product.is_free) return 0
    if (product.discount_percentage > 0) {
      return product.price * (1 - product.discount_percentage / 100)
    }
    return product.price
  }

  const handleAddToCart = () => {
    if (!product) return
    const cartProduct = {
      id: product._id,
      name: product.title,
      price: getDiscountedPrice(),
      quantity: 1,
      image: getImages()[0],
      inStock: true,
      options: {
        edition: selectedLicense,
        format: selectedFormat || "default",
      },
      optionsAvailable: {
        edition: [
          t("productDetail.licensePersonal"),
          t("productDetail.licenseCommercial"),
          t("productDetail.licenseExtended"),
        ],
        format: product.file_format?.length > 0 ? product.file_format : ["Default"],
      },
    }
    addToCart(cartProduct)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleOpenReviews = () => {
    setShowReviews(true)
    setTimeout(() => {
      document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareStatus(t("productDetail.copied"))
      } else {
        setShareStatus(url)
      }
    } catch { setShareStatus(url) }
    setTimeout(() => setShareStatus(""), 2500)
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // Error
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {error === "notFound" ? "Product not found" : "Failed to load product"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
          >
            <ArrowLeft size={16} />
            {t("common.back")}
          </button>
        </div>
      </div>
    )
  }

  const licenses = [
    { id: "personal", nameKey: "productDetail.licensePersonal", descriptionKey: "productDetail.licensePersonalDesc" },
    { id: "commercial", nameKey: "productDetail.licenseCommercial", descriptionKey: "productDetail.licenseCommercialDesc" },
    { id: "extended", nameKey: "productDetail.licenseExtended", descriptionKey: "productDetail.licenseExtendedDesc" },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          {/* Carousel / Product Images */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <ProductCarousel images={getImages()} />
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {t("productDetail.productDetail")}
                </p>
                {product.category?.name && (
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400">
                    {product.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {product.title}
              </h1>
              {product.creator?.username && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  by {product.creator.username}
                </p>
              )}
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {product.short_description || product.description || ""}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                {product.is_free ? (
                  <span className="text-2xl font-semibold text-green-600">{t("orders.free") || "Free"}</span>
                ) : (
                  <>
                    <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      ${getDiscountedPrice().toFixed(2)}
                    </span>
                    {product.discount_percentage > 0 && (
                      <>
                        <span className="text-lg text-zinc-400 line-through">${product.price.toFixed(2)}</span>
                        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                          -{product.discount_percentage}%
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={handleOpenReviews}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                <span className="text-zinc-900 dark:text-zinc-100">{averageRating}</span>
                <span className="text-zinc-400">/</span>
                <span>{t("productDetail.reviewCount", { count: totalReviewCount || product.ratings_count || 0 })}</span>
              </button>
            </div>

            {/* Asset metadata */}
            {(product.tags?.length > 0 || product.file_size || product.polygon_count > 0) && (
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {product.file_size && <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">{product.file_size}</span>}
                {product.polygon_count > 0 && <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">{product.polygon_count.toLocaleString()} polys</span>}
                {product.animated && <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded">Animated</span>}
                {product.rigged && <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded">Rigged</span>}
                {product.tags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">#{tag}</span>
                ))}
              </div>
            )}

            <div className="grid gap-5">
              {/* License type */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {t("productDetail.licenseType")}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {licenses.map((license) => (
                    <button
                      key={license.id}
                      onClick={() => setSelectedLicense(license.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        selectedLicense === license.id
                          ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      }`}
                    >
                      {t(license.nameKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* File format from real data */}
              {product.file_format?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {t("productDetail.fileFormat")}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {product.file_format.map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          selectedFormat === fmt
                            ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                        }`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Game engine support */}
              {product.game_engine_support?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Game Engine
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {product.game_engine_support.map((engine) => (
                      <span key={engine} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {engine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  addedToCart
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <ShoppingCart size={16} />
                {addedToCart ? t("productDetail.added") : t("productDetail.addToCart")}
              </button>
              <button className="flex-1 h-12 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition">
                {t("productDetail.buyNow")}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <button
                onClick={async () => {
                  if (!user) { navigate("/login"); return }
                  const result = await toggleWishlist(productId)
                  setWishlistSaved(result?.added ?? !wishlistSaved)
                }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  wishlistSaved
                    ? "border-red-500 dark:border-red-400 text-red-500 dark:text-red-400"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                <Heart size={14} fill={wishlistSaved ? "currentColor" : "none"} />
                <span>{wishlistSaved ? t("productDetail.saved") : t("productDetail.addToWishlist")}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 transition"
              >
                <Share2 size={14} />
                <span>{t("productDetail.share")}</span>
              </button>
              {shareStatus && (
                <span className="text-zinc-500 dark:text-zinc-400">{shareStatus}</span>
              )}
              {/* Stats */}
              <span className="ml-auto text-zinc-400">
                {product.downloads_count || 0} downloads · {product.views_count || 0} views
              </span>
            </div>
          </div>
        </div>

        {/* Rating Summary */}
        <div className="mt-10">
          <RatingSection
            rating={averageRating}
            reviewCount={totalReviewCount || product.ratings_count || 0}
            breakdown={ratingBreakdown}
          />
        </div>

        <div id="reviews-section" className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t("productDetail.reviewDetailsTitle")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {t("productDetail.reviewDetailsSummary", {
                  rating: averageRating,
                  count: totalReviewCount || product.ratings_count || 0,
                  topPercent: ratingBreakdown[0]?.percentage || 0,
                })}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {t("productDetail.verifiedOnly")}
              </p>
            </div>
            <button
              onClick={() => setShowReviews((prev) => !prev)}
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              {showReviews ? t("productDetail.hideReviews") : t("productDetail.showReviews")}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {ratingBreakdown.map((item) => (
              <div key={item.stars} className="grid grid-cols-[40px_1fr_60px] items-center gap-3 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t("productDetail.starLabel", { stars: item.stars })}
                </span>
                <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: t("productDetail.filterAll") },
              { key: 5, label: t("productDetail.filterFive") },
              { key: 4, label: t("productDetail.filterFour") },
              { key: 3, label: t("productDetail.filterThree") },
              { key: 2, label: t("productDetail.filterTwo") },
              { key: 1, label: t("productDetail.filterOne") },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setReviewFilter(filter.key)
                  setVisibleReviews(3)
                  setShowReviews(true)
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  reviewFilter === filter.key
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {showReviews && (
            <div className="mt-6 space-y-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("productDetail.reviewsShowing", {
                  shown: Math.min(visibleReviewList.length, filteredTotal),
                  total: filteredTotal,
                })}
              </div>
              {filteredReviews.length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("productDetail.noReviews")}
                </div>
              ) : (
                visibleReviewList.map((review) => (
                  <div key={review._id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {review.user?.username || "User"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">{review.rating}</span> / 5
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
              {filteredReviews.length > visibleReviews && (
                <button
                  onClick={() => setVisibleReviews((prev) => prev + 3)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 transition"
                >
                  {t("productDetail.loadMore")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <ProductDescription description={product.description || ""} />

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  )
}
