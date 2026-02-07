import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Filter, Grid3x3 } from "lucide-react"

const PRODUCTS = [
  { id: 1, name: "Lumina UI Kit", price: 49.99, rating: 4.8, reviews: 124, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop", category: "ui" },
  { id: 2, name: "3D Character Pack", price: 29.99, rating: 4.5, reviews: 87, image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop", category: "3d" },
  { id: 3, name: "VFX Collection", price: 39.99, rating: 4.6, reviews: 156, image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop", category: "vfx" },
  { id: 4, name: "2D Sprite Pack", price: 19.99, rating: 4.2, reviews: 98, image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=300&h=300&fit=crop", category: "2d" },
  { id: 5, name: "Audio Pack Pro", price: 24.99, rating: 4.7, reviews: 142, image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop", category: "audio" },
  { id: 6, name: "UI Elements Bundle", price: 54.99, rating: 4.9, reviews: 201, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop", category: "ui" },
  { id: 7, name: "Character Animator Kit", price: 44.99, rating: 4.4, reviews: 115, image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop", category: "3d" },
  { id: 8, name: "Particle Effects Pack", price: 34.99, rating: 4.6, reviews: 89, image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop", category: "vfx" }
]

export default function BrowseAll() {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState("newest")
  const [filterCategory, setFilterCategory] = useState("all")
  
  const categories = [
    { id: "all", label: "All" },
    { id: "2d", label: "2D" },
    { id: "3d", label: "3D" },
    { id: "ui", label: "UI" },
    { id: "audio", label: "Audio" },
    { id: "vfx", label: "VFX" }
  ]

  const filteredProducts = filterCategory === "all" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === filterCategory)

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "popular":
        return b.reviews - a.reviews
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("browseAll.allProducts")}
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
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filterCategory === cat.id
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {cat.label}
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="group border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md dark:hover:shadow-none transition cursor-pointer"
            >
              <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 h-48">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {product.rating}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    ({product.reviews})
                  </span>
                </div>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
