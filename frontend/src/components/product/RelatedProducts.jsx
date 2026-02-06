import { Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function RelatedProducts({ products }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="py-6 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 mb-4">
        <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">
          {t("productDetail.relatedProducts", "Sản Phẩm Liên Quan")}
        </h3>
        <button
          onClick={() => navigate("/", { state: { scrollTo: "related" } })}
          className="text-primary text-sm font-bold hover:opacity-70 transition"
        >
          {t("productDetail.viewAll", "Xem Tất Cả")}
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-4 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[160px] flex flex-col gap-2 cursor-pointer group"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {/* Product Image */}
            <div className="relative w-full aspect-square rounded-xl bg-cover bg-center overflow-hidden shadow-sm">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
            </div>

            {/* Product Info */}
            <p className="text-slate-900 dark:text-slate-100 text-sm font-bold truncate">
              {product.title}
            </p>

            {/* Price and Wishlist */}
            <div className="flex justify-between items-center">
              <span className="text-primary font-bold text-sm">${product.price}</span>
              <button className="hover:text-red-500 transition">
                <Heart size={16} className="text-slate-400 dark:text-slate-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
