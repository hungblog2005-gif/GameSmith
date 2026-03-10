import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Share2, ShoppingCart, Loader2, ArrowLeft, Check } from "lucide-react"
import { CartContext } from "../context/CartContext"
import { UserDataContext } from "../context/UserDataContext"
import { useAuth } from "../context/AuthContext"

// product components
import ProductCarousel from "../components/product/ProductCarousel"
import RatingSection from "../components/product/RatingSection"
import ProductDescription from "../components/product/ProductDescription"
import RelatedProducts from "../components/product/RelatedProducts"
import PaymentModal from "../components/payment/PaymentModal"
import SEOHead from "../components/SEOHead"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addToCart } = useContext(CartContext)
  const { toggleWishlist, isInWishlist } = useContext(UserDataContext)
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [seo, setSeo] = useState(null)
  const [allRelatedProducts, setAllRelatedProducts] = useState([])
  const [displayCount, setDisplayCount] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedLicense, setSelectedLicense] = useState("personal")
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [wishlistSaved, setWishlistSaved] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlistMessage, setWishlistMessage] = useState("")
  const [shareStatus, setShareStatus] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Rating state
  const [canUserReview, setCanUserReview] = useState({
    can_review: false,
    has_purchased: false,
    has_reviewed: false,
  })

  // Sync wishlist state when product loads
  useEffect(() => {
    if (productId) setWishlistSaved(isInWishlist(productId))
  }, [productId, isInWishlist])

  // Fetch product and related
  useEffect(() => {
    if (!productId) return

    setLoading(true)
    setError(null)

    // Fetch asset + recommendations in parallel (critical path)
    // SEO is fetched independently — does NOT block page render
    Promise.all([
      fetch(`${API_BASE}/assets/${productId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/recommendations/asset/${productId}?limit=10`).then(r => r.ok ? r.json() : []),
    ]).then(async ([asset, related]) => {
      if (!asset) {
        setError("notFound")
        return
      }
      setProduct(asset)

      let finalProducts = (related || []).map(a => {
        const thumbUrl = a.thumbnail_url ? (a.thumbnail_url.startsWith("/") ? `${API_BASE}${a.thumbnail_url}` : a.thumbnail_url) : null
        const previewUrl = a.preview_images?.[0] ? (a.preview_images[0].startsWith("/") ? `${API_BASE}${a.preview_images[0]}` : a.preview_images[0]) : null
        return {
          id: a._id,
          title: a.title,
          price: a.is_free ? 0 : (a.discount_percentage > 0 ? a.price * (1 - a.discount_percentage / 100) : a.price),
          image: thumbUrl || previewUrl || "https://placehold.co/400x400?text=No+Image",
        }
      })

      // Nếu sản phẩm liên quan quá ít, lấy thêm sản phẩm khác
      if (finalProducts.length < 12) {
        try {
          const additionalRes = await fetch(`${API_BASE}/assets?limit=20&skip=0`)
          if (additionalRes.ok) {
            const additionalData = await additionalRes.json()
            const additionalProducts = (additionalData.data || [])
              .filter(a => a._id !== productId && !finalProducts.some(fp => fp.id === a._id))
              .slice(0, 20)
              .map(a => {
                const thumbUrl = a.thumbnail_url ? (a.thumbnail_url.startsWith("/") ? `${API_BASE}${a.thumbnail_url}` : a.thumbnail_url) : null
                const previewUrl = a.preview_images?.[0] ? (a.preview_images[0].startsWith("/") ? `${API_BASE}${a.preview_images[0]}` : a.preview_images[0]) : null
                return {
                  id: a._id,
                  title: a.title,
                  price: a.is_free ? 0 : (a.discount_percentage > 0 ? a.price * (1 - a.discount_percentage / 100) : a.price),
                  image: thumbUrl || previewUrl || "https://placehold.co/400x400?text=No+Image",
                }
              })
            finalProducts = [...finalProducts, ...additionalProducts]
          }
        } catch (e) {
          console.error("Failed to fetch additional products:", e)
        }
      }

      setAllRelatedProducts(finalProducts)
      // Set default format
      if (asset.file_format?.length > 0) {
        setSelectedFormat(asset.file_format[0])
      }
      // Increment views
      fetch(`${API_BASE}/assets/${productId}/view`, { method: "POST" }).catch(() => {})
    }).catch(() => setError("networkError"))
      .finally(() => setLoading(false))

    // SEO fetch is non-blocking — enriches meta tags after page renders
    fetch(`${API_BASE}/assets/${productId}/seo`)
      .then(r => r.ok ? r.json() : null)
      .then(seoData => {
        if (!seoData) return
        setSeo(seoData)
      })
      .catch(() => {})

    return () => {}
  }, [productId])

  // Check if user can review
  useEffect(() => {
    if (!productId || !user?.id) return

    const token = user?.token || localStorage.getItem("authToken")
    if (!token) return

    fetch(`${API_BASE}/reviews/asset/${productId}/can-review`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCanUserReview(data)
      })
      .catch(() => {})
  }, [productId, user])

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

  // Price calculations
  const getDiscountedPrice = () => {
    if (!product) return 0
    if (product.is_free) return 0
    if (product.discount_percentage > 0) {
      return product.price * (1 - product.discount_percentage / 100)
    }
    return product.price
  }

  const handleAddToCart = async () => {
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
    const result = await addToCart(cartProduct)
    if (result?.requiresLogin) {
      navigate("/login")
      return
    }
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
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

  const handleBuyNow = () => {
    if (!user) {
      navigate("/login")
      return
    }
    setShowPaymentModal(true)
  }

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

  // ── SEO: compute meta values + JSON-LD ─────────────────────────────────
  const seoTitle = seo?.title || product.title
  const seoDescription = seo?.metaDescription || product.short_description || product.description || ""
  const seoKeywords = seo?.keywords?.join(", ") || product.tags?.join(", ") || ""
  const seoImage = getImages()[0] || "/assets/logo.png"

  const discountedPrice = product.is_free ? 0 : getDiscountedPrice()

  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "name": product.title,
        "description": seoDescription,
        "image": seoImage,
        "keywords": seoKeywords || undefined,
        "brand": { "@type": "Brand", "name": "GameSmith" },
        "offers": {
          "@type": "Offer",
          "price": discountedPrice.toFixed(2),
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "GameSmith" },
        },
        ...(product.stats?.averageRating > 0 && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.stats.averageRating.toFixed(1),
            "reviewCount": product.stats.reviewCount || 1,
            "bestRating": "5",
            "worstRating": "1",
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${window.location.origin}/` },
          { "@type": "ListItem", "position": 2, "name": "Browse Assets", "item": `${window.location.origin}/browse-all` },
          ...(product.category?.name
            ? [{ "@type": "ListItem", "position": 3, "name": product.category.name, "item": `${window.location.origin}/browse-all?category=${product.category._id}` }]
            : []),
          { "@type": "ListItem", "position": product.category?.name ? 4 : 3, "name": product.title },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-36 sm:pb-0">
      <SEOHead
        title={seoTitle}
        description={seoDescription.slice(0, 160)}
        canonical={`/product/${productId}`}
        ogImage={seoImage}
        ogType="product"
        schema={productSchema}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 sm:gap-8 items-start">
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
              <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
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
                      className={`rounded-lg border px-3 py-3 sm:py-2 text-xs font-medium transition active:scale-95 ${
                        selectedLicense === license.id
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
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

            {/* Action Buttons — hidden on mobile (shown in sticky bar below) */}
            <div className="hidden sm:flex flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 ${
                  addedToCart
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-500"
                }`}
              >
                {addedToCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                {addedToCart ? t("productDetail.added") : t("productDetail.addToCart")}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 h-12 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 active:scale-95 transition"
              >
                {product.is_free ? 'Nhận miễn phí' : t("productDetail.buyNow")}
              </button>
            </div>

            <div className="hidden sm:flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <button
                onClick={async () => {
                  if (!user) { navigate("/login"); return }
                  if (wishlistLoading) return
                  setWishlistLoading(true)
                  try {
                    const result = await toggleWishlist(productId)
                    const isAdded = result?.added ?? !wishlistSaved
                    setWishlistSaved(isAdded)
                    if (isAdded) {
                      setWishlistMessage(t("wishlist.addedToWishlist") || "Added to wishlist!")
                      setTimeout(() => setWishlistMessage(""), 2500)
                    }
                  } catch (error) {
                    console.error("Error updating wishlist:", error)
                    setWishlistMessage("Error updating wishlist")
                    setTimeout(() => setWishlistMessage(""), 2500)
                  } finally {
                    setWishlistLoading(false)
                  }
                }}
                disabled={wishlistLoading}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 transition active:scale-95 ${
                  wishlistLoading
                    ? "opacity-60 border-zinc-300 dark:border-zinc-700 text-zinc-500"
                    : wishlistSaved
                    ? "border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                {wishlistLoading ? <Loader2 size={14} className="animate-spin" /> : wishlistSaved ? <Check size={14} /> : <Heart size={14} />}
                <span>{wishlistLoading ? (t("common.loading") || "...") : wishlistSaved ? (t("productDetail.saved") || "Saved") : t("productDetail.addToWishlist")}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 active:scale-95 transition"
              >
                <Share2 size={14} />
                <span>{t("productDetail.share")}</span>
              </button>
              {shareStatus && <span>{shareStatus}</span>}
              {wishlistMessage && (
                <span className={`font-medium ${
                  wishlistMessage.toLowerCase().includes("error") ? "text-red-500" : "text-green-600 dark:text-green-400"
                }`}>{wishlistMessage}</span>
              )}
            </div>

            {/* ── Sticky bottom bar (mobile only) ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 safe-area-pb">
              <div className="flex gap-3 mb-2">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 ${
                    addedToCart
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  {addedToCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                  {addedToCart ? t("productDetail.added") : t("productDetail.addToCart")}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-bold active:scale-95 transition"
                >
                  {product.is_free ? 'Nhận miễn phí' : t("productDetail.buyNow")}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!user) { navigate("/login"); return }
                    if (wishlistLoading) return
                    setWishlistLoading(true)
                    try {
                      const result = await toggleWishlist(productId)
                      const isAdded = result?.added ?? !wishlistSaved
                      setWishlistSaved(isAdded)
                      if (isAdded) {
                        setWishlistMessage(t("wishlist.addedToWishlist") || "Added!")
                        setTimeout(() => setWishlistMessage(""), 2500)
                      }
                    } catch {
                      setWishlistMessage("Error")
                      setTimeout(() => setWishlistMessage(""), 2500)
                    } finally {
                      setWishlistLoading(false)
                    }
                  }}
                  disabled={wishlistLoading}
                  className={`flex-1 h-10 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    wishlistLoading ? "opacity-60 border-zinc-300 dark:border-zinc-700 text-zinc-500"
                    : wishlistSaved ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {wishlistLoading ? <Loader2 size={13} className="animate-spin" /> : wishlistSaved ? <Check size={13} /> : <Heart size={13} />}
                  {wishlistSaved ? (t("productDetail.saved") || "Saved") : t("productDetail.addToWishlist")}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400 active:scale-95 transition"
                >
                  <Share2 size={13} />
                  {t("productDetail.share")}
                </button>
              </div>
              {(shareStatus || wishlistMessage) && (
                <p className={`text-center text-xs mt-1.5 font-medium ${
                  wishlistMessage?.toLowerCase().includes("error") ? "text-red-500" : "text-green-600 dark:text-green-400"
                }`}>{wishlistMessage || shareStatus}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="mt-8 sm:mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8 sm:pt-12">
          <RatingSection
            productId={productId}
            currentUserId={user?.id}
            token={user?.token || localStorage.getItem("authToken")}
            canUserRate={canUserReview.can_review}
            onRatingSuccess={() => {
              // Refresh user review status
              if (user?.id) {
                const tok = user?.token || localStorage.getItem("authToken")
                fetch(`${API_BASE}/reviews/asset/${productId}/can-review`, {
                  headers: { Authorization: `Bearer ${tok}` },
                })
                  .then(r => r.ok ? r.json() : null)
                  .then(data => {
                    if (data) setCanUserReview(data)
                  })
                  .catch(() => {})
              }
            }}
          />
        </div>

        {/* Description */}
        <ProductDescription description={product.description || ""} />

        {/* Related Products */}
        <RelatedProducts 
          products={allRelatedProducts} 
          displayCount={displayCount}
          onLoadMore={() => setDisplayCount(prev => prev + 12)}
          hasMore={displayCount < allRelatedProducts.length}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            // After free claim succeeds, re-check can-review status
            if (user?.id && productId) {
              const token = user?.token || localStorage.getItem("authToken")
              fetch(`${API_BASE}/reviews/asset/${productId}/can-review`, {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then(response => response.ok ? response.json() : null)
                .then(data => {
                  if (data) setCanUserReview(data)
                })
                .catch(() => {})
            }
          }}
          product={product}
          selectedLicense={selectedLicense}
          selectedFormat={selectedFormat}
          discountedPrice={getDiscountedPrice()}
        />
      </div>
    </div>
  )
}
