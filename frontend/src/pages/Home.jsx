import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Loader2 } from "lucide-react"
import AssetCard from "../components/product/AssetCard"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [featuredAssets, setFeaturedAssets] = useState([])
  const [allAssets, setAllAssets] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, assetsRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/assets/featured?limit=6`),
          fetch(`${API_BASE}/assets`),
          fetch(`${API_BASE}/categories`),
        ])
        const [featured, assets, cats] = await Promise.all([
          featuredRes.json(),
          assetsRes.json(),
          categoriesRes.json(),
        ])
        setFeaturedAssets(featured)
        setAllAssets(assets)
        setCategories(cats)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const selectedAsset = featuredAssets[selectedIndex]

  const filteredAssets = activeCategory === "all"
    ? allAssets
    : allAssets.filter(a => a.category?._id === activeCategory || a.category?.slug === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-950">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        {featuredAssets.length > 0 ? (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
            <div
              role="button"
              tabIndex={0}
              className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-left cursor-pointer"
              onClick={() => navigate(`/product/${selectedAsset?._id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${selectedAsset?._id}`) }}
            >
              <img
                src={selectedAsset?.thumbnail_url || selectedAsset?.preview_images?.[0]}
                alt={selectedAsset?.title}
                className="w-full h-full object-cover min-h-[320px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">{t("home.featured")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {selectedAsset?.title}
                </h2>
                <p className="mt-2 text-sm text-white/80 max-w-xl">
                  {selectedAsset?.short_description || selectedAsset?.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/product/${selectedAsset?._id}`)
                    }}
                    className="h-10 px-4 rounded-lg bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition"
                  >
                    {t("home.viewDetails")}
                  </button>
                  <button
                    className="h-10 px-4 rounded-lg border border-white/40 text-white text-sm font-semibold hover:border-white/70 transition inline-flex items-center gap-2"
                  >
                    <Heart size={16} />
                    {t("home.save")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {featuredAssets.map((asset, index) => (
                <button
                  key={asset._id}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${
                    selectedIndex === index
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                  }`}
                >
                  <img
                    src={asset.thumbnail_url || asset.preview_images?.[0]}
                    alt={asset.title}
                    className="w-12 h-16 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {asset.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {asset.category?.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            {t("home.noFeatured")}
          </div>
        )}
      </section>

      {/* Assets Grid Section */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl">{t("home.title")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {t("home.curatedSubtitle")}
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              activeCategory === "all"
                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
            }`}
          >
            {t("sidebar.allAssets")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                activeCategory === cat._id
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <AssetCard key={asset._id} asset={asset} />
            ))
          ) : (
            <p className="col-span-full text-center py-8 text-zinc-500 dark:text-zinc-400">
              {t("home.noAssets") || "No assets found."}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
