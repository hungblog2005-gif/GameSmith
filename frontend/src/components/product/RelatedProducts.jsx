import { Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function RelatedProducts({ products = [] }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!products || products.length === 0) return null

  return (
    <div className="mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {t("productDetail.relatedProducts")}
        </h3>
        <button
          onClick={() => navigate("/browse")}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
        >
          {t("productDetail.viewAll")}
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-2 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[180px] flex flex-col gap-2 cursor-pointer group"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="relative w-full aspect-square rounded-xl bg-cover bg-center overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>

            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {product.title}
            </p>

            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">${product.price}</span>
              <button className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition">
                <Heart size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
