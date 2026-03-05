import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams, useLocation } from "react-router-dom"
import { Camera, Loader2, Sparkles } from "lucide-react"
import AssetCard from "../components/product/AssetCard"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function BrowseAll() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { state } = useLocation()
  const initialCategory = searchParams.get("category") || "all"
  const searchQuery = searchParams.get("search") || ""

  // Image search results passed via navigation state (from Navbar camera search)
  const imageResults = state?.imageResults || []
  const imageCaption = state?.imageCaption || ""

  const [sortBy, setSortBy] = useState("newest")
  const [filterCategory, setFilterCategory] = useState(initialCategory)
  const [assets, setAssets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiResults, setAiResults] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({ status: "published" })
        if (searchQuery) params.set("search", searchQuery)
        const [assetsRes, catsRes] = await Promise.all([
          fetch(`${API_BASE}/assets?${params.toString()}`),
          fetch(`${API_BASE}/categories`),
        ])
        const [assetsData, catsData] = await Promise.all([
          assetsRes.json(),
          catsRes.json(),
        ])
        setAssets(assetsData)
        setCategories(catsData)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [searchQuery])

  useEffect(() => {
    if (!searchQuery) {
      setAiResults([])
      return
    }
    setAiLoading(true)
    fetch(`${API_BASE}/recommendations/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
      .then((r) => r.json())
      .then((data) => setAiResults(Array.isArray(data) ? data : []))
      .catch(() => setAiResults([]))
      .finally(() => setAiLoading(false))
  }, [searchQuery])

  const filteredProducts = filterCategory === "all"
    ? assets
    : assets.filter(a => a.category?._id === filterCategory || a.category?.slug === filterCategory)

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "popular":
        return (b.downloads_count || 0) - (a.downloads_count || 0)
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {searchQuery ? `Results for "${searchQuery}"` : t("browseAll.allProducts")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {sortedProducts.length} products
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-3">
              {t("browseAll.filterBy")} Category
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-4 py-2 rounded-lg transition ${
                  filterCategory === "all"
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setFilterCategory(cat._id)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filterCategory === cat._id
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-3">
              {t("browseAll.sortBy")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-48 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            >
              <option value="newest">{t("browseAll.newest")}</option>
              <option value="popular">{t("browseAll.popular")}</option>
              <option value="price-low">{t("browseAll.priceLow")}</option>
              <option value="price-high">{t("browseAll.priceHigh")}</option>
            </select>
          </div>
        </div>

        {/* Image Search Results (from Navbar camera upload) */}
        {imageResults.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Camera size={17} className="text-blue-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Visual similarity results
              </h2>
              {imageCaption && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  {imageCaption}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {imageResults.map((asset) => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>
            <hr className="mt-8 border-zinc-200 dark:border-zinc-800" />
          </div>
        )}

        {/* AI Semantic Results */}
        {searchQuery && (aiLoading || aiResults.length > 0) && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={17} className="text-violet-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                AI-powered matches
              </h2>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                semantic
              </span>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding semantic matches…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {aiResults.map((asset) => (
                  <AssetCard key={asset._id} asset={asset} />
                ))}
              </div>
            )}
            <hr className="mt-8 border-zinc-200 dark:border-zinc-800" />
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sortedProducts.length > 0 ? (
            sortedProducts.map((asset) => (
              <AssetCard key={asset._id} asset={asset} />
            ))
          ) : (
            <p className="col-span-full text-center py-8 text-zinc-500 dark:text-zinc-400">
              {t("home.noAssets")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
