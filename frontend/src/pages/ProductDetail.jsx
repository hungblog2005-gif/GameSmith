import { useState, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Share2, ShoppingCart } from "lucide-react"
import { CartContext } from "../context/CartContext"

// product components
import ProductCarousel from "../components/product/ProductCarousel"
import RatingSection from "../components/product/RatingSection"
import ProductDescription from "../components/product/ProductDescription"
import RelatedProducts from "../components/product/RelatedProducts"


export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addToCart } = useContext(CartContext)
  const [selectedLicense, setSelectedLicense] = useState("personal")
  const [selectedFormat, setSelectedFormat] = useState("fig")
  const [addedToCart, setAddedToCart] = useState(false)
  const [wishlistSaved, setWishlistSaved] = useState(false)
  const [shareStatus, setShareStatus] = useState("")
  const [showReviews, setShowReviews] = useState(false)
  const [reviewFilter, setReviewFilter] = useState("all")
  const [visibleReviews, setVisibleReviews] = useState(3)

  // Sample product data - replace with API call
  const product = {
    id: parseInt(productId) || 1,
    title: "Lumina UI Kit - Glassmorphism Edition",
    price: 49,
    rating: 4.8,
    reviewCount: 124,
    shortDescription: t("productDetail.shortDescription"),
    description: t("productDetail.longDescription"),
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDVwtezjmMKP4CBBpaz0LhXjF4yXVapGuFwu4BEB8xkkeyNFN_A2vWvpsbKu8fnOX_lcK3G9GCTk0Whl7O3me1I2pGTJ6_g9DGpHwtTTNTvmDwnsroi79blhA-kx42pdyIlxRKhFCwe_XmJHjoVowe53gmfh-pSoM8SQzsbz9gM1Pnrn1tRaobXos3qfs2flldy2o23GnbjmUPLhRFyZL_9qwI3p5z3IVDo-1SC4y4mh_JJ-pzeUTA8SQgaSNVGtrr6665m0z7zV-92",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbsRRFwtMMDzEJ2083Q9rTC1toF-kC2EpJzc9qJIwLZVN839cnVQDUaDgUalozZWBibUPTAd4J2F-Si82tOzndfYO_TV_XjQ1YJkMv3Z_ga99pWfitVsyfZLcLOjrHH8XWBoqHIUx7mnj2TvAgV2sJETW7TLKop322NpfOYRoS5TK_4bd2HJqU-1F_7ADDmX8JerRnEc9ugeR9966Jh3MvjARiymuLEfRowGPWSntw6MrM9MNcV7j-AU049zzLBK6YWJPpaOIWbn-M",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnlH6lRkwPH1egrZGmVtbGS1ggfdb42z7q07x20-n3sRUhRnKG4-bPyEpHl6EVU0mpVbSDjAzq6sPOouci_YGQZZtYxIu9HOeHc6nCodpuhlLk7B30eftBltyzpXpTtJdcWjgbBUgyNTLphIGlxG7jux-fVyksocSntMU4_mhRarnppa8bcEwlhKBlBn_wubITudNKy3qfQjsx1V0a1_xH9ri3mBtxBRe6dr_qSPEvvRdYalHFYQN3GJPuwbRAD7hH0A_Pwv53gpPY",
    ],
    ratingBreakdown: [
      { stars: 5, percentage: 87, count: 108 },
      { stars: 4, percentage: 8, count: 10 },
      { stars: 3, percentage: 3, count: 4 },
      { stars: 2, percentage: 1, count: 1 },
      { stars: 1, percentage: 1, count: 1 },
    ],
    formats: [
      { id: "fig", name: "FIG", icon: "description" },
      { id: "svg", name: "SVG", icon: "image" },
      { id: "png", name: "PNG", icon: "image" },
    ],
    licenses: [
      { id: "personal", nameKey: "productDetail.licensePersonal", descriptionKey: "productDetail.licensePersonalDesc" },
      { id: "commercial", nameKey: "productDetail.licenseCommercial", descriptionKey: "productDetail.licenseCommercialDesc" },
      { id: "extended", nameKey: "productDetail.licenseExtended", descriptionKey: "productDetail.licenseExtendedDesc" },
    ],
    relatedProducts: [
      {
        id: 1,
        title: "3D Shape Pack",
        price: 24,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaaf72OUHBkezj1bPT2jsDTR39s1G_Dmkf7DlbQRlAmLqNYvKw11FMOtd_Y7ZR_fRcfZ7WWCHAgkATGLdAoM0il9sME8rcgSXsOTnFOXKzppNb-MqrPYvalKJn7AO6G0TkO0oeu5Nf6622unKvNJ4W5NX1QRkP-OI7VqoXHnTvURjU3OWoZs_QqOsjAcS_rh11hnviNsz6X02xhU31g-y_BspXsjE3sGHMo3OmDGCQfVQMHCrSSl0OosAvNIB-5lYfCbth7h5jowvU",
      },
      {
        id: 2,
        title: "Minimal Icons v2",
        price: 19,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7Zu5YtkGhj75sMlCa9SMxyNujuyxvE8DcBjt93QnJj4u47QwmcmNqTeucaC9Lf6S8gSWAtT7iaIfMmzeHmil8MpBBl2HsGQR__WnekeWVtCpmyJHAx_yXck0onKS_Xi5NO5GZ_thkuZ4D0nmC5Oo0txFbHN4aM6-QO4n1oVPQf8xRDWmSeIKHGMjoXUx0kjivUc1i7EeAk4-BuAX9Oqr0W2Dt7p_ujoai6iEvVpIJtaxn7vtSDsUBb4L22n6bzfGEOUszjaOxGSES",
      },
      {
        id: 3,
        title: "Gradient Mesh",
        price: 12,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9xBPRa2Bpq2kBVL3GeYd_Lm9CfK2vDQwrQPQKaWDVpblkgDR8iKY1lwq25wQjWoFq5Zzeb5sZlQFL9sDDWShFtinMuuWMWQSiee90t8RXWnOnrfTjeFp3vq-WloqtohSY6xc824Sg86xTKg-St3owPcThTQfaczLOiMnC-CTPg3bsltGSCVauiyALBMZMhWpjkTcnj0BsYo89tZ5sSxPwytTuxYyo6WJMZ5FAw1NZLP3qdcLAetJOJ5gP_tyPKQecWHfGO-p_M1b4",
      },
    ],
  }

  const totalReviewCount = product.ratingBreakdown.reduce(
    (sum, item) => sum + item.count,
    0
  )
  const ratingBreakdown = product.ratingBreakdown.map((item) => ({
    ...item,
    percentage: totalReviewCount
      ? Math.round((item.count / totalReviewCount) * 100)
      : 0,
  }))
  const averageRating = totalReviewCount
    ? (
        product.ratingBreakdown.reduce(
          (sum, item) => sum + item.stars * item.count,
          0
        ) / totalReviewCount
      ).toFixed(1)
    : "0.0"
  const reviewTemplates = {
    5: {
      title: t("productDetail.reviewTemplates.five.title"),
      comment: t("productDetail.reviewTemplates.five.comment"),
    },
    4: {
      title: t("productDetail.reviewTemplates.four.title"),
      comment: t("productDetail.reviewTemplates.four.comment"),
    },
    3: {
      title: t("productDetail.reviewTemplates.three.title"),
      comment: t("productDetail.reviewTemplates.three.comment"),
    },
    2: {
      title: t("productDetail.reviewTemplates.two.title"),
      comment: t("productDetail.reviewTemplates.two.comment"),
    },
    1: {
      title: t("productDetail.reviewTemplates.one.title"),
      comment: t("productDetail.reviewTemplates.one.comment"),
    },
  }
  const reviewerNames = [
    "Linh",
    "Minh",
    "Quang",
    "Bao",
    "Khanh",
    "Tuan",
    "Nhi",
    "Huy",
    "Trang",
    "An",
    "Vy",
    "Thanh",
  ]
  const reviewImages = [
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=280&fit=crop",
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=400&h=280&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop",
  ]
  const ratingPool = ratingBreakdown.flatMap((item) =>
    Array.from({ length: item.count }, () => item.stars)
  )
  const reviews = ratingPool.map((stars, index) => {
    const template = reviewTemplates[stars]
    const day = String((index % 28) + 1).padStart(2, "0")
    const month = String(((index + 3) % 12) + 1).padStart(2, "0")
    return {
      id: index + 1,
      name: `${reviewerNames[index % reviewerNames.length]} ${index + 1}`,
      rating: stars,
      title: template.title,
      comment: template.comment,
      date: `2025-${month}-${day}`,
      verified: true,
      images: index % 11 === 0 ? [reviewImages[index % reviewImages.length]] : [],
    }
  })
  const filteredReviews = reviewFilter === "all"
    ? reviews
    : reviews.filter((review) => review.rating === reviewFilter)
  const visibleReviewList = filteredReviews.slice(0, visibleReviews)
  const filteredTotal = reviewFilter === "all" ? totalReviewCount : filteredReviews.length

  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.title,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      inStock: true,
      options: {
        edition: selectedLicense,
        format: selectedFormat,
        color: "Default"
      },
      optionsAvailable: {
        edition: product.licenses.map(l => t(l.nameKey)),
        format: product.formats.map(f => f.name),
        color: ["Default"]
      }
    }
    
    addToCart(cartProduct)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleOpenReviews = () => {
    setShowReviews(true)
    setTimeout(() => {
      document.getElementById("reviews-section")?.scrollIntoView({
        behavior: "smooth",
      })
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
    } catch (error) {
      setShareStatus(url)
    }
    setTimeout(() => setShareStatus(""), 2500)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          {/* Carousel / Product Images */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <ProductCarousel images={product.images} />
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {t("productDetail.productDetail")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {product.title}
              </h1>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                ${product.price}.00
              </div>
              <button
                onClick={handleOpenReviews}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                <span className="text-zinc-900 dark:text-zinc-100">{averageRating}</span>
                <span className="text-zinc-400">/</span>
                <span>{t("productDetail.reviewCount", { count: totalReviewCount })}</span>
              </button>
            </div>

            <div className="grid gap-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {t("productDetail.licenseType")}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {product.licenses.map((license) => (
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

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {t("productDetail.fileFormat")}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {product.formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        selectedFormat === format.id
                          ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      }`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              </div>
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
                onClick={() => setWishlistSaved((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  wishlistSaved
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                <Heart size={14} />
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
            </div>
          </div>
        </div>

        {/* Rating Summary */}
        <div className="mt-10">
          <RatingSection
            rating={averageRating}
            reviewCount={totalReviewCount}
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
                  count: totalReviewCount,
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
                  <div key={review.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {review.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{review.date}</p>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {review.rating} / 5
                      </div>
                    </div>
                    {review.verified && (
                      <div className="mt-2 inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-200">
                        {t("productDetail.verifiedPurchase")}
                      </div>
                    )}
                    <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {review.title}
                    </p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {review.comment}
                    </p>
                    {review.images.length > 0 && (
                      <div className="mt-3 flex gap-3 overflow-x-auto">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Review ${review.id} ${index + 1}`}
                            className="h-20 w-28 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                          />
                        ))}
                      </div>
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
        <ProductDescription description={product.description} />

        {/* Recommended / Related Products */}
        <RelatedProducts products={product.relatedProducts} />
      </div>
    </div>
  )
}
