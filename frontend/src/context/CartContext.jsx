import { createContext, useState, useEffect, useRef } from "react"
import { useAuth } from "./AuthContext"

export const CartContext = createContext()

const CART_STORAGE_KEY = "gamesmith_cart"
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

// ─── helpers ────────────────────────────────────────────────────────────────

function loadLocalCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveLocalCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

function getImageUrl(url) {
  if (!url) return null
  return url.startsWith("/") ? `${API_BASE}${url}` : url
}

/** Convert a single server cart item (with assetId populated) to the local format */
function normalizeServerItem(item) {
  const a = item.assetId // populated asset doc
  if (!a || typeof a !== "object") return null

  const price = a.is_free
    ? 0
    : a.discount_percentage > 0
      ? parseFloat((a.price * (1 - a.discount_percentage / 100)).toFixed(2))
      : a.price

  const image =
    getImageUrl(a.thumbnail_url) ||
    getImageUrl(a.preview_images?.[0]) ||
    "https://placehold.co/400x400?text=No+Image"

  return {
    id: a._id,
    name: a.title,
    price,
    quantity: item.quantity ?? 1,
    image,
    inStock: true,
    options: item.options ?? {},
    optionsAvailable: {
      format: a.file_format?.length > 0 ? a.file_format : ["Default"],
    },
  }
}

/** Normalize the full cart API response into an array of local cart items */
function normalizeServerCart(serverCart) {
  if (!serverCart?.items) return []
  return serverCart.items.map(normalizeServerItem).filter(Boolean)
}

// ─── provider ───────────────────────────────────────────────────────────────

export function CartProvider({ children }) {
  const { user } = useAuth()
  const prevUserRef = useRef(user)

  // Single source of truth for UI (works for both guest and logged-in)
  const [cartItems, setCartItems] = useState([])
  // Track whether this is the initial mount
  const initialized = useRef(false)

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (user?.id) {
      // Logged in on mount: fetch server cart
      fetchServerCart(user.id)
    } else {
      // Guest on mount: use localStorage
      setCartItems(loadLocalCart())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── react to login / logout ───────────────────────────────────────────────
  useEffect(() => {
    const prev = prevUserRef.current
    prevUserRef.current = user

    if (!initialized.current) return // handled by init effect

    if (user?.id && !prev?.id) {
      // Just logged IN: load server cart
      fetchServerCart(user.id)
      saveLocalCart([]) // clear any stale local data
    } else if (!user && prev?.id) {
      // Just logged OUT: fall back to (now empty) localStorage
      setCartItems(loadLocalCart())
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── persist for guests ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      saveLocalCart(cartItems)
    }
  }, [cartItems, user?.id])

  // ── API helpers ───────────────────────────────────────────────────────────

  async function fetchServerCart(userId) {
    try {
      const res = await fetch(`${API_BASE}/carts/user/${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setCartItems(normalizeServerCart(data))
    } catch (e) {
      console.error("CartContext: fetchServerCart failed", e)
    }
  }

  async function mergeAndLoad(userId, guestItems) {
    try {
      const body = {
        items: guestItems.map(item => ({ id: item.id, quantity: item.quantity, options: item.options })),
      }
      const res = await fetch(`${API_BASE}/carts/user/${userId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { await fetchServerCart(userId); return }
      const data = await res.json()
      setCartItems(normalizeServerCart(data))
    } catch (e) {
      console.error("CartContext: mergeAndLoad failed", e)
      await fetchServerCart(userId)
    }
  }

  // ── public actions ────────────────────────────────────────────────────────

  /**
   * Returns { requiresLogin: true } when not logged in — caller should redirect.
   * Returns { success: true } on success.
   */
  const addToCart = async (product) => {
    if (!user?.id) {
      return { requiresLogin: true }
    }
    try {
      const res = await fetch(`${API_BASE}/carts/user/${user.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: product.id, quantity: product.quantity ?? 1, options: product.options ?? {} }),
      })
      if (!res.ok) return { success: false }
      const data = await res.json()
      setCartItems(normalizeServerCart(data))
      return { success: true }
    } catch (e) {
      console.error("CartContext: addToCart failed", e)
      return { success: false }
    }
  }

  const removeItem = async (id) => {
    if (user?.id) {
      try {
        const res = await fetch(`${API_BASE}/carts/user/${user.id}/items/${id}`, { method: "DELETE" })
        if (!res.ok) return
        const data = await res.json()
        setCartItems(normalizeServerCart(data))
      } catch (e) {
        console.error("CartContext: removeItem failed", e)
      }
    } else {
      setCartItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateQuantity = async (id, newQty) => {
    if (newQty <= 0) { removeItem(id); return }
    if (user?.id) {
      const item = cartItems.find(i => i.id === id)
      try {
        const res = await fetch(`${API_BASE}/carts/user/${user.id}/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty, options: item?.options }),
        })
        if (!res.ok) return
        const data = await res.json()
        setCartItems(normalizeServerCart(data))
      } catch (e) {
        console.error("CartContext: updateQuantity failed", e)
      }
    } else {
      setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item))
    }
  }

  const updateOption = async (id, optionKey, value) => {
    const item = cartItems.find(i => i.id === id)
    if (!item) return
    const newOptions = { ...item.options, [optionKey]: value }

    if (user?.id) {
      try {
        const res = await fetch(`${API_BASE}/carts/user/${user.id}/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: item.quantity, options: newOptions }),
        })
        if (!res.ok) return
        const data = await res.json()
        setCartItems(normalizeServerCart(data))
      } catch (e) {
        console.error("CartContext: updateOption failed", e)
      }
    } else {
      setCartItems(prev => prev.map(i => i.id === id ? { ...i, options: newOptions } : i))
    }
  }

  const clearCart = async () => {
    if (user?.id) {
      try {
        await fetch(`${API_BASE}/carts/user/${user.id}`, { method: "DELETE" })
      } catch (e) {
        console.error("CartContext: clearCart failed", e)
      }
    }
    setCartItems([])
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        updateQuantity,
        updateOption,
        clearCart,
        cartCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
