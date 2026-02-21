import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Loader2 } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const CATEGORY_STYLES = [
  { icon: "🎭", color: "from-orange-500 to-red-500" },
  { icon: "🖼️", color: "from-purple-500 to-pink-500" },
  { icon: "🎵", color: "from-indigo-500 to-purple-500" },
  { icon: "✨", color: "from-green-500 to-emerald-500" },
  { icon: "⚡", color: "from-yellow-500 to-orange-500" },
  { icon: "🎨", color: "from-blue-500 to-cyan-500" },
]

export default function Categories() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [assetCounts, setAssetCounts] = useState({})
  const [featuredAssets, setFeaturedAssets] = useState([])
  const [loading, setLoading] = useState(true)

  const getImageUrl = (url) => {
    if (!url) return null
    return url.startsWith("/") ? `${API_BASE}${url}` : url
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, countsRes, featuredRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/assets/count-by-category`),
          fetch(`${API_BASE}/assets/featured?limit=4`),
        ])
        const [cats, counts, featured] = await Promise.all([
          catsRes.json(),
          countsRes.json(),
          featuredRes.json(),
        ])
        setCategories(cats)
        const countMap = {}
        counts.forEach((c) => { countMap[c._id] = c.count })
        setAssetCounts(countMap)
        setFeaturedAssets(featured)
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalAssets = Object.values(assetCounts).reduce((sum, c) => sum + c, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("categories.allCategories")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Explore our comprehensive collection of game assets
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* All Assets card */}
          <a
            href="/browse-all"
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md dark:hover:shadow-none transition cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-5 group-hover:opacity-10 transition"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">🎨</span>
                <ChevronRight size={24} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition transform group-hover:translate-x-1" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                {t("sidebar.allAssets")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {totalAssets} assets
              </p>
            </div>
          </a>

          {categories.map((cat, index) => {
            const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length]
            const count = assetCounts[cat._id] || 0
            return (
              <a
                key={cat._id}
                href={`/browse-all?category=${cat._id}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md dark:hover:shadow-none transition cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-5 group-hover:opacity-10 transition`}></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{style.icon}</span>
                    <ChevronRight size={24} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {count} {count === 1 ? "asset" : "assets"}
                  </p>
                </div>
              </a>
            )
          })}
        </div>

        {/* Featured Section */}
        {featuredAssets.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
              Featured Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredAssets.slice(0, 2).map((asset) => (
                <a
                  key={asset._id}
                  href={`/product/${asset._id}`}
                  className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-none transition"
                >
                  <img
                    src={getImageUrl(asset.thumbnail_url) || getImageUrl(asset.preview_images?.[0]) || "https://placehold.co/400x400?text=No+Image"}
                    alt={asset.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                      {asset.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {asset.short_description || asset.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
