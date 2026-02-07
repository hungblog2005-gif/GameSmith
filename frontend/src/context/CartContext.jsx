import { createContext, useState } from "react"

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Lumina UI Kit",
      price: 49.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop",
      inStock: true,
      options: {
        edition: "Standard",
        color: "Light Theme"
      },
      optionsAvailable: {
        edition: ["Standard", "Pro", "Enterprise"],
        color: ["Light Theme", "Dark Theme", "Auto"]
      }
    },
    {
      id: 2,
      name: "3D Character Pack",
      price: 29.99,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop",
      inStock: true,
      options: {
        edition: "Full Pack",
        color: "All Colors"
      },
      optionsAvailable: {
        edition: ["Full Pack", "Base Pack"],
        color: ["All Colors", "Grayscale"]
      }
    },
    {
      id: 3,
      name: "VFX Collection",
      price: 39.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop",
      inStock: false,
      options: {
        edition: "Premium",
        color: "N/A"
      },
      optionsAvailable: {
        edition: ["Premium"],
        color: ["N/A"]
      }
    }
  ])

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => 
      item.id === product.id &&
      JSON.stringify(item.options) === JSON.stringify(product.options)
    )
    
    if (existingItem) {
      // If same item with same options exists, increase quantity
      setCartItems(cartItems.map(item =>
        (item.id === product.id && JSON.stringify(item.options) === JSON.stringify(product.options))
          ? { ...item, quantity: item.quantity + (product.quantity || 1) }
          : item
      ))
    } else {
      // Add new item if options are different
      setCartItems([...cartItems, product])
    }
  }

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeItem(id)
      return
    }
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    ))
  }

  const updateOption = (id, optionKey, value) => {
    setCartItems(cartItems.map(item =>
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
