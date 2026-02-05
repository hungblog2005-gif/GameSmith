import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Share2, ShoppingCart } from "lucide-react"
import ProductCarousel from "../components/ProductCarousel"
import RatingSection from "../components/RatingSection"
import ProductDescription from "../components/ProductDescription"
import RelatedProducts from "../components/RelatedProducts"

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [selectedLicense, setSelectedLicense] = useState("personal")
  const [selectedFormat, setSelectedFormat] = useState("fig")
  const [addedToCart, setAddedToCart] = useState(false)

  // Sample product data - replace with API call
  const product = {
    id: parseInt(productId) || 1,
    title: "Lumina UI Kit - Glassmorphism Edition",
    price: 49,
    rating: 4.8,
    reviewCount: 124,
    shortDescription: "Bộ UI Kit hiện đại với thiết kế glassmorphism cho các dự án fintech, SaaS và portfolio.",
    description:
      "Elevate your next project with Lumina UI Kit. This comprehensive set features over 200 high-fidelity components designed with a focus on modern glassmorphism aesthetics. Perfectly suited for fintech, SaaS, and creative portfolios. Fully customizable and organized for Figma.",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDVwtezjmMKP4CBBpaz0LhXjF4yXVapGuFwu4BEB8xkkeyNFN_A2vWvpsbKu8fnOX_lcK3G9GCTk0Whl7O3me1I2pGTJ6_g9DGpHwtTTNTvmDwnsroi79blhA-kx42pdyIlxRKhFCwe_XmJHjoVowe53gmfh-pSoM8SQzsbz9gM1Pnrn1tRaobXos3qfs2flldy2o23GnbjmUPLhRFyZL_9qwI3p5z3IVDo-1SC4y4mh_JJ-pzeUTA8SQgaSNVGtrr6665m0z7zV-92",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbsRRFwtMMDzEJ2083Q9rTC1toF-kC2EpJzc9qJIwLZVN839cnVQDUaDgUalozZWBibUPTAd4J2F-Si82tOzndfYO_TV_XjQ1YJkMv3Z_ga99pWfitVsyfZLcLOjrHH8XWBoqHIUx7mnj2TvAgV2sJETW7TLKop322NpfOYRoS5TK_4bd2HJqU-1F_7ADDmX8JerRnEc9ugeR9966Jh3MvjARiymuLEfRowGPWSntw6MrM9MNcV7j-AU049zzLBK6YWJPpaOIWbn-M",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnlH6lRkwPH1egrZGmVtbGS1ggfdb42z7q07x20-n3sRUhRnKG4-bPyEpHl6EVU0mpVbSDjAzq6sPOouci_YGQZZtYxIu9HOeHc6nCodpuhlLk7B30eftBltyzpXpTtJdcWjgbBUgyNTLphIGlxG7jux-fVyksocSntMU4_mhRarnppa8bcEwlhKBlBn_wubITudNKy3qfQjsx1V0a1_xH9ri3mBtxBRe6dr_qSPEvvRdYalHFYQN3GJPuwbRAD7hH0A_Pwv53gpPY",
    ],
    ratingBreakdown: [
      { stars: 5, percentage: 70, count: 87 },
      { stars: 4, percentage: 20, count: 25 },
      { stars: 3, percentage: 5, count: 6 },
      { stars: 2, percentage: 3, count: 4 },
      { stars: 1, percentage: 2, count: 2 },
    ],
    formats: [
      { id: "fig", name: "FIG", icon: "description" },
      { id: "svg", name: "SVG", icon: "image" },
      { id: "png", name: "PNG", icon: "image" },
    ],
    licenses: [
      { id: "personal", name: "Personal", description: "Cho sử dụng cá nhân" },
      { id: "commercial", name: "Commercial", description: "Cho sử dụng thương mại" },
      { id: "extended", name: "Extended", description: "Giấy phép mở rộng" },
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

  const handleAddToCart = () => {
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Top AppBar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 justify-between border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="text-primary flex size-10 shrink-0 items-center cursor-pointer hover:opacity-70"
        >
          <span className="text-xl">←</span>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center px-4 truncate">
          {t("productDetail.productDetail", "Chi tiết sản phẩm")}
        </h2>
        <button className="flex items-center justify-center h-10 w-10 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition">
          <Share2 size={20} className="text-slate-900 dark:text-slate-100" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col overflow-x-hidden">
        {/* Carousel / Product Images */}
        <ProductCarousel images={product.images} />

        {/* Headline & Price */}
        <div className="px-4 pt-4">
          <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold leading-tight mb-3">
            {product.title}
          </h1>
          <div className="flex items-center justify-between">
            <div className="text-primary text-2xl font-black leading-tight">
              ${product.price}.00
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg">
              <span className="text-primary text-sm filled-icon">★</span>
              <span className="text-primary font-bold text-sm">{product.rating}</span>
            </div>
          </div>
        </div>

        {/* Rating Summary */}
        <RatingSection rating={product.rating} reviewCount={product.reviewCount} breakdown={product.ratingBreakdown} />

        {/* Configuration Section */}
        <div className="px-4 flex flex-col gap-6 py-4">
          {/* License Type */}
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-3">
              {t("productDetail.licenseType", "Loại Giấy Phép")}
            </h3>
            <div className="flex gap-2">
              {product.licenses.map((license) => (
                <button
                  key={license.id}
                  onClick={() => setSelectedLicense(license.id)}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 text-sm font-bold text-center transition ${
                    selectedLicense === license.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary"
                  }`}
                >
                  {license.name}
                </button>
              ))}
            </div>
          </div>

          {/* File Format */}
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-3">
              {t("productDetail.fileFormat", "Định Dạng File")}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 whitespace-nowrap transition ${
                    selectedFormat === format.id
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary"
                  }`}
                >
                  <span className="text-lg">{format.icon === "description" ? "📄" : "🖼️"}</span>
                  <span className="text-sm font-medium dark:text-slate-200">{format.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <ProductDescription description={product.description} />

        {/* Action Buttons */}
        <div className="px-4 py-6 flex gap-3">
          <button
            onClick={handleAddToCart}
            className={`flex-1 h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              addedToCart
                ? "bg-green-500 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <ShoppingCart size={18} />
            {addedToCart ? t("productDetail.added", "Đã thêm") : t("productDetail.addToCart", "Thêm vào giỏ")}
          </button>
          <button className="flex-[1.5] h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-primary/25 hover:bg-blue-700 transition">
            {t("productDetail.buyNow", "Mua Ngay")}
          </button>
        </div>

        {/* Recommended / Related Products */}
        <RelatedProducts products={product.relatedProducts} />

        <div className="h-10 bg-background-light dark:bg-background-dark"></div>
      </div>
    </div>
  )
}
