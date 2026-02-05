import { useNavigate } from "react-router-dom"
import { Heart } from "lucide-react"

export default function AssetCard({ asset }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/product/${asset.id}`)}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left"
    >
      <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={asset.image}
          alt={asset.title}
          className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
        />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{asset.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{asset.tag}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <span className="font-bold text-primary">${asset.price}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="p-1.5 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            <Heart size={18} className="text-zinc-400 dark:text-zinc-600" />
          </button>
        </div>
      </div>
    </button>
  )
}
