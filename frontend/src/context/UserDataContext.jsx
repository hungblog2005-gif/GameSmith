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
          (Array.isArray(assets) ? assets : []).map((a) => {
            const asset = a.assetId // populated asset doc
            if (!asset || typeof asset !== 'object') return null
            return {
              id: asset._id,
              name: asset.title,
              price: asset.is_free ? 0 : (asset.discount_percentage > 0 ? asset.price * (1 - asset.discount_percentage / 100) : asset.price),
              originalPrice: asset.price,
              discount: asset.discount_percentage || 0,
              isFree: asset.is_free || false,
              rating: asset.ratings?.average || 0,
              reviews: asset.ratings?.count || 0,
              image: toAbsoluteUrl(asset.thumbnail_url) || "https://placehold.co/300x300?text=No+Image",
              category: asset.category?.name || "",
            }
          }).filter(Boolean)
        )
      }
    } catch { /* silently fail */ }
    finally { setWishlistLoading(false) }
  }, [userId])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const toggleWishlist = async (assetId) => {
    if (!userId) return { added: false }
    
    const isCurrentlyInWishlist = wishlistItems.some((item) => item.id === assetId)
    
    // Optimistic update - update UI immediately
    if (isCurrentlyInWishlist) {
      setWishlistItems((prev) => prev.filter((item) => item.id !== assetId))
    } else {
      // If adding, we need to fetch the product details
      try {
        const productRes = await fetch(`${API_BASE}/assets/${assetId}`)
        if (productRes.ok) {
          const product = await productRes.json()
          setWishlistItems((prev) => [...prev, {
            id: product._id,
            name: product.title,
            price: product.is_free ? 0 : (product.discount_percentage > 0 ? product.price * (1 - product.discount_percentage / 100) : product.price),
            originalPrice: product.price,
            discount: product.discount_percentage || 0,
            isFree: product.is_free || false,
            rating: product.ratings_average || 0,
            reviews: product.ratings_count || 0,
            image: toAbsoluteUrl(product.thumbnail_url) || "https://placehold.co/300x300?text=No+Image",
            category: product.category?.name || "",
          }])
        }
      } catch (e) {
        console.error("Failed to fetch product:", e)
      }
    }

    // Make API call to confirm
    try {
      const res = await fetch(`${API_BASE}/wishlists/user/${userId}/asset/${assetId}`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        // Verify with server, refresh if mismatch
        await fetchWishlist()
        return data
      } else {
        // Rollback optimistic update
        await fetchWishlist()
      }
    } catch (e) {
      // Rollback optimistic update
      console.error("Failed to toggle wishlist:", e)
      await fetchWishlist()
    }
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
