import { useNavigate } from "react-router-dom"
import { Heart } from "lucide-react"

export default function AssetCard({ asset }) {
  const navigate = useNavigate()

  const displayPrice = asset.is_free
    ? "Free"
    : asset.discount_percentage > 0
      ? `$${(asset.price * (1 - asset.discount_percentage / 100)).toFixed(2)}`
      : `$${asset.price}`

  const categoryName = asset.category?.name || ""

  return (
    <button
      onClick={() => navigate(`/product/${asset._id}`)}
      className="group rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-zinc-400 transition text-left"
    >
      <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <img
          src={asset.thumbnail_url || asset.preview_images?.[0]}
          alt={asset.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {asset.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            -{asset.discount_percentage}%
          </span>
        )}
        {asset.featured && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            Featured
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{asset.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{categoryName}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{displayPrice}</span>
            {asset.discount_percentage > 0 && !asset.is_free && (
              <span className="text-xs text-zinc-400 line-through">${asset.price}</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <Heart size={18} />
          </button>
        </div>
      </div>
    </button>
  )
}
