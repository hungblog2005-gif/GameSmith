import { useContext, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { UserDataContext } from "../context/UserDataContext"
import { CartContext } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { Heart, ShoppingCart, Share2, X, Loader2, Check } from "lucide-react"

export default function Wishlist() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { wishlistItems, wishlistLoading, removeFromWishlist } = useContext(UserDataContext)
  const { addToCart } = useContext(CartContext)
  const [addedMap, setAddedMap] = useState({})

  const handleAddToCart = async (item) => {
    const result = await addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      inStock: true,
      options: { edition: "Personal", format: "Default" },
      optionsAvailable: { edition: ["Personal", "Commercial"], format: ["Default"] },
    })
    if (result?.requiresLogin) { navigate("/login"); return }
    if (result?.success) {
      setAddedMap(prev => ({ ...prev, [item.id]: true }))
      setTimeout(() => setAddedMap(prev => ({ ...prev, [item.id]: false })), 2000)
    }
  }

  const handleShare = async (item) => {
    const url = `${window.location.origin}/product/${item.id}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      }
    } catch { /* ignore */ }
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Heart size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("wishlist.loginRequired")}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
          >
            {t("navbar.login")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("wishlist.myWishlist")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {wishlistItems.length} {t("wishlist.items", { count: wishlistItems.length })}
          </p>
        </div>

        {/* Loading */}
        {wishlistLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("wishlist.emptyWishlist")}
            </p>
            <button
              onClick={() => navigate("/browse-all")}
              className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
            >
              {t("wishlist.addProducts")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="group border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md dark:hover:shadow-none transition"
              >
                {/* Image Container */}
                <div
                  className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 h-48 cursor-pointer"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Category badge */}
                  {item.category && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {item.category}
                    </span>
                  )}
                  {/* Discount badge */}
                  {item.discount > 0 && (
                    <span className="absolute top-3 left-3 mt-7 px-2 py-0.5 bg-green-500/90 text-white rounded text-xs font-semibold">
                      -{item.discount}%
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromWishlist(item.id) }}
                    className="absolute top-3 right-3 p-2 bg-white dark:bg-zinc-900 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <X size={20} className="text-red-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    {item.name}
                  </h3>

                  {/* Rating */}
                  {item.rating > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {item.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        ({item.reviews})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    {item.isFree ? (
                      <span className="text-lg font-semibold text-green-600">{t("orders.free") || "Free"}</span>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.discount > 0 && (
                          <span className="text-sm text-zinc-400 line-through">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                        addedMap[item.id]
                          ? "bg-green-600 text-white"
                          : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                      }`}
                    >
                      {addedMap[item.id] ? (
                        <><Check size={18} />{t("cart.added") || "Added!"}</>
                      ) : (
                        <><ShoppingCart size={18} />{t("wishlist.addToCart")}</>
                      )}
                    </button>
                    <button
                      onClick={() => handleShare(item)}
                      className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                    >
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
