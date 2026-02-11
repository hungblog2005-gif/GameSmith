import { createContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./AuthContext"

export const UserDataContext = createContext()

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== "string") return value
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  if (value.startsWith("/")) return `${API_BASE}${value}`
  return value
}

export function UserDataProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id || user?._id

  // ─── Wishlist (real API) ───
  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!userId) { setWishlistItems([]); return }
    setWishlistLoading(true)
    try {
      const res = await fetch(`${API_BASE}/wishlists/user/${userId}`)
      if (res.ok) {
        const assets = await res.json()
        setWishlistItems(
          (Array.isArray(assets) ? assets : []).map((a) => ({
            id: a._id,
            name: a.title,
            price: a.is_free ? 0 : (a.discount_percentage > 0 ? a.price * (1 - a.discount_percentage / 100) : a.price),
            originalPrice: a.price,
            discount: a.discount_percentage || 0,
            isFree: a.is_free || false,
            rating: a.ratings_average || 0,
            reviews: a.ratings_count || 0,
            image: toAbsoluteUrl(a.thumbnail_url) || "https://placehold.co/300x300?text=No+Image",
            category: a.category?.name || "",
          }))
        )
      }
    } catch { /* silently fail */ }
    finally { setWishlistLoading(false) }
  }, [userId])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const toggleWishlist = async (assetId) => {
    if (!userId) return { added: false }
    try {
      const res = await fetch(`${API_BASE}/wishlists/user/${userId}/asset/${assetId}`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        await fetchWishlist()
        return data // { added: true/false }
      }
    } catch { /* ignore */ }
    return { added: false }
  }

  const removeFromWishlist = async (assetId) => {
    if (!userId) return
    // Optimistic update
    setWishlistItems((prev) => prev.filter((item) => item.id !== assetId))
    try {
      await fetch(`${API_BASE}/wishlists/user/${userId}/asset/${assetId}`, { method: "DELETE" })
    } catch {
      // Rollback on error
      fetchWishlist()
    }
  }

  const addToWishlist = async (assetId) => {
    if (!userId) return
    return toggleWishlist(assetId)
  }

  const isInWishlist = (assetId) => {
    return wishlistItems.some((item) => item.id === assetId)
  }

  // ─── Downloads (static demo for now) ───
  const [downloads] = useState([])

  return (
    <UserDataContext.Provider
      value={{
        wishlistItems,
        wishlistLoading,
        removeFromWishlist,
        addToWishlist,
        toggleWishlist,
        isInWishlist,
        refreshWishlist: fetchWishlist,
        downloads,
        wishlistCount: wishlistItems.length,
        downloadsCount: downloads.length
      }}
    >
      {children}
    </UserDataContext.Provider>
  )
}
