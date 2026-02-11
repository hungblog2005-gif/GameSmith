import { createContext, useState, useEffect } from "react"

export const CartContext = createContext()

const CART_STORAGE_KEY = "gamesmith_cart"

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart)

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item =>
        item.id === product.id &&
        JSON.stringify(item.options) === JSON.stringify(product.options)
      )

      if (existingItem) {
        return prev.map(item =>
          (item.id === product.id && JSON.stringify(item.options) === JSON.stringify(product.options))
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        )
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }]
    })
  }

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeItem(id)
      return
    }
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    ))
  }

  const updateOption = (id, optionKey, value) => {
    setCartItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, options: { ...item.options, [optionKey]: value } }
        : item
    ))
  }

  const clearCart = () => {
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
        cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
