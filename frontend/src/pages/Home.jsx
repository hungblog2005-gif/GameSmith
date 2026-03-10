import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2, Sparkles, ChevronLeft, ChevronRight, ShoppingCart, Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import Footer from "../components/Footer"
import SEOHead from "../components/SEOHead"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

function getImageUrl(url) {
  if (!url) return null
  return url.startsWith("/") ? `${API_BASE}${url}` : url
}

function formatPrice(asset) {
  if (asset.is_free) return { label: "Free", original: null, discount: null }
  if (asset.discount_percentage > 0) {
    const final = (asset.price * (1 - asset.discount_percentage / 100)).toFixed(2)
    return { label: `$${final}`, original: `$${asset.price}`, discount: `-${asset.discount_percentage}%` }
  }
  return { label: `$${asset.price}`, original: null, discount: null }
}

// Portrait card (Epic-style game cover)
function EpicCard({ asset, onClick, className = "flex-shrink-0 w-44 sm:w-48" }) {
  const price = formatPrice(asset)
  const img = getImageUrl(asset.thumbnail_url) || getImageUrl(asset.preview_images?.[0])
  const catName = asset.categoryId?.name || asset.category?.name || ""

  return (
    <button
      onClick={onClick}
      className={`group text-left focus:outline-none ${className}`}
    >
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
        {img ? (
          <img
            src={img}
            alt={`${asset.title}${catName ? ` – ${catName}` : " – Game Asset"}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {price.discount && (
          <span className="absolute top-2 left-2 bg-blue-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
            {price.discount}
          </span>
        )}
        {asset.is_free && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
            FREE
          </span>
        )}
        {asset.featured && !asset.is_free && !price.discount && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
            FEATURED
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wide truncate">{catName}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate mt-0.5">{asset.title}</p>
        <div className="flex items-center gap-2 mt-1">
          {price.original && (
            <span className="text-[11px] text-zinc-400 line-through">{price.original}</span>
          )}
          <span className={`text-sm font-bold ${asset.is_free ? "text-emerald-500" : "text-zinc-900 dark:text-white"}`}>
            {price.label}
          </span>
        </div>
      </div>
    </button>
  )
}

// Horizontal scroll row
function ScrollRow({ assets, onCardClick }) {
  const ref = useRef(null)
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 220, behavior: "smooth" })
  }
  return (
    <div className="relative group/row">
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/3 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition -translate-x-4 group-hover/row:translate-x-0 hover:bg-zinc-700"
      >
        <ChevronLeft size={16} />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {assets.map(asset => (
          <EpicCard key={asset._id} asset={asset} onClick={() => onCardClick(asset._id)} />
        ))}
      </div>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/3 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition translate-x-4 group-hover/row:translate-x-0 hover:bg-zinc-700"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [featuredAssets, setFeaturedAssets] = useState([])
  const [allAssets, setAllAssets] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, assetsRes] = await Promise.all([
          fetch(`${API_BASE}/assets/featured?limit=6`),
          fetch(`${API_BASE}/assets?status=published`),
        ])
        const [featured, assetsData] = await Promise.all([featuredRes.json(), assetsRes.json()])
        setFeaturedAssets(featured)
        setAllAssets(Array.isArray(assetsData) ? assetsData : (assetsData.data ?? []))
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!user?.id) return
    fetch(`${API_BASE}/recommendations/user/${user.id}?limit=12`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAiRecommendations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [user?.id])

  // Auto-advance hero
  useEffect(() => {
    if (featuredAssets.length < 2) return
    const id = setInterval(() => setSelectedIndex(i => (i + 1) % featuredAssets.length), 6000)
    return () => clearInterval(id)
  }, [featuredAssets.length])

  const selectedAsset = featuredAssets[selectedIndex]

  const categories = ["All", ...Array.from(new Set(
    allAssets.map(a => a.categoryId?.name || a.category?.name).filter(Boolean)
  ))]

  const filteredAssets = selectedCategory === "All"
    ? allAssets
    : allAssets.filter(a => (a.categoryId?.name || a.category?.name) === selectedCategory)

  const freeAssets = allAssets.filter(a => a.is_free)

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GameSmith",
    "description": "Premium marketplace for high-quality game assets",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/browse-all?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <SEOHead
        description="Browse premium game assets on GameSmith. Download high-quality 3D models, textures, audio, UI kits, VFX, and more for your game projects."
        canonical="/"
        schema={websiteSchema}
      />

      {/* ── HERO ── */}
      <div className="bg-[#121212] text-white">
      {featuredAssets.length > 0 && (
        <section className="relative w-full h-[70vh] min-h-[480px] max-h-[680px] overflow-hidden">
          {/* Background image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={getImageUrl(selectedAsset?.thumbnail_url) || getImageUrl(selectedAsset?.preview_images?.[0]) || "https://placehold.co/1600x900?text=No+Image"}
                alt={selectedAsset?.title ? `${selectedAsset.title} – Featured Game Asset` : "Featured Game Asset"}
                loading="eager"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#121212] to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Hero content */}
          <div className="relative h-full max-w-6xl mx-auto px-6 flex items-end pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="max-w-xl"
              >
                <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">{t("home.featured")}</p>
                <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-3 text-white">
                  {selectedAsset?.title}
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-2">
                  {selectedAsset?.short_description || selectedAsset?.description}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/product/${selectedAsset?._id}`)}
                    className="h-11 px-7 rounded-md bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-200 transition flex items-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    {t("home.viewDetails")}
                  </button>
                  <button className="h-11 w-11 rounded-md border border-zinc-600 hover:border-zinc-400 flex items-center justify-center transition">
                    <Heart size={18} className="text-zinc-300" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnail strip (right side, desktop) */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 w-48">
            {featuredAssets.map((asset, i) => (
              <button
                key={asset._id}
                onClick={() => setSelectedIndex(i)}
                className={`flex items-center gap-3 rounded-lg p-2 text-left transition ${
                  selectedIndex === i
                    ? "bg-white/15 border border-white/30"
                    : "hover:bg-white/8 border border-transparent"
                }`}
              >
                <img
                  src={getImageUrl(asset.thumbnail_url) || getImageUrl(asset.preview_images?.[0]) || "https://placehold.co/80x100"}
                  alt={`${asset.title} – Game Asset Preview`}
                  loading="lazy"
                  className="w-10 h-14 rounded object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{asset.title}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {asset.is_free ? "Free" : `$${asset.price}`}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Dot navigation */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {featuredAssets.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`h-1 rounded-full transition-all ${selectedIndex === i ? "bg-white w-6" : "bg-white/30 w-1.5"}`}
              />
            ))}
          </div>
        </section>
      )}

      </div>{/* end hero dark wrapper */}

      {/* ── SEPARATOR FADE ── */}
      <div className="relative h-24 -mt-1 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#121212]/70 to-transparent dark:to-transparent to-white" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 py-4 relative z-10">

        {/* ── FREE ASSETS ── */}
        {freeAssets.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-1 h-6 bg-emerald-400 rounded-full" />
                <h2 className="text-lg font-bold">Free Assets</h2>
              </div>
              <button
                onClick={() => { setSelectedCategory("All"); navigate("/browse-all") }}
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
              >
                {t("home.viewAll") || "View All"} →
              </button>
            </div>
            <ScrollRow assets={freeAssets} onCardClick={(id) => navigate(`/product/${id}`)} />
          </section>
        )}

        {/* ── AI RECOMMENDATIONS ── */}
        {aiRecommendations.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-violet-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">AI Powered</p>
                  <h2 className="text-lg font-bold">{t("home.aiRecommendedForYou") || "Recommended For You"}</h2>
                </div>
              </div>
              <button
                onClick={() => navigate("/browse-all")}
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
              >
                {t("home.viewAll")} →
              </button>
            </div>
            <ScrollRow assets={aiRecommendations} onCardClick={(id) => navigate(`/product/${id}`)} />
          </section>
        )}

        {/* ── BROWSE BY CATEGORY ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="w-1 h-6 bg-blue-400 rounded-full" />
              <h2 className="text-lg font-bold">{t("home.recommendedForYou") || "Browse by Category"}</h2>
            </div>
            <button
              onClick={() => navigate("/browse-all")}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
            >
              {t("home.viewAll")} →
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  selectedCategory === cat
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {filteredAssets.length > 0 ? (
                filteredAssets.slice(0, 12).map(asset => (
                  <EpicCard key={asset._id} asset={asset} className="w-full" onClick={() => navigate(`/product/${asset._id}`)} />
                ))
              ) : (
                <p className="col-span-full text-center py-8 text-zinc-500">
                  {t("home.noAssets") || "No assets found."}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

      </div>
      <Footer />
    </div>
  )
}
