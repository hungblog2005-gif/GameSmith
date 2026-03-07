import { Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function RelatedProducts({ 
  products = [], 
  displayCount = 12,
  onLoadMore,
  hasMore = false
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!products || products.length === 0) return null

  const visibleProducts = products.slice(0, displayCount)

  return (
    <div className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t("productDetail.recommendedProducts") || "Recommended for You"}
        </h3>
        <a
          href="/browse-all"
          className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
        >
          {t("productDetail.viewAll")} →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {visibleProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            className="flex flex-col gap-2 group text-left hover:opacity-80 transition"
          >
            <div className="relative w-full aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
            </div>

            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate line-clamp-2">
              {product.title}
            </p>

            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">${product.price}</span>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-500 dark:hover:border-zinc-500 transition"
          >
            {t("productDetail.loadMore") || "Load More Products"}
          </button>
        </div>
      )}
    </div>
  )
}
