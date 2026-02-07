import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { UserDataContext } from "../context/UserDataContext"
import { Heart, ShoppingCart, Share2, X } from "lucide-react"

export default function Wishlist() {
  const { t } = useTranslation()
  const { wishlistItems, removeFromWishlist } = useContext(UserDataContext)

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("wishlist.myWishlist")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Wishlist Container */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("wishlist.emptyWishlist")}
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
            >
              {t("wishlist.addProducts")}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="group border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md dark:hover:shadow-none transition"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 h-48">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white dark:bg-zinc-900 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <X size={20} className="text-red-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {item.rating}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      ({item.reviews})
                    </span>
                  </div>

                  {/* Price */}
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    ${item.price.toFixed(2)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition">
                      <ShoppingCart size={18} />
                      {t("wishlist.addToCart")}
                    </button>
                    <button className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
