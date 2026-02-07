import { createContext, useState } from "react"

export const UserDataContext = createContext()

export function UserDataProvider({ children }) {
  const [orders] = useState([
    {
      id: "ORD-2024-001",
      date: "2024-12-15",
      status: "delivered",
      items: [
        { id: 1, name: "Lumina UI Kit", price: 49.99, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop" }
      ],
      total: 49.99
    },
    {
      id: "ORD-2024-002",
      date: "2024-12-10",
      status: "shipped",
      items: [
        { id: 2, name: "3D Character Pack", price: 29.99, image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop" },
        { id: 3, name: "VFX Collection", price: 39.99, image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop" }
      ],
      total: 69.98
    },
    {
      id: "ORD-2024-003",
      date: "2024-12-05",
      status: "pending",
      items: [
        { id: 4, name: "2D Sprite Pack", price: 19.99, image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop" }
      ],
      total: 19.99
    },
    {
      id: "ORD-2024-004",
      date: "2024-11-30",
      status: "delivered",
      items: [
        { id: 5, name: "Animation Pack", price: 39.99, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop" }
      ],
      total: 39.99
    },
    {
      id: "ORD-2024-005",
      date: "2024-11-25",
      status: "delivered",
      items: [
        { id: 6, name: "UI Patterns", price: 29.99, image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop" }
      ],
      total: 29.99
    },
    {
      id: "ORD-2024-006",
      date: "2024-11-20",
      status: "delivered",
      items: [
        { id: 7, name: "Design System", price: 59.99, image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop" }
      ],
      total: 59.99
    },
    {
      id: "ORD-2024-007",
      date: "2024-11-15",
      status: "delivered",
      items: [
        { id: 8, name: "Mockup Kit", price: 44.99, image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop" }
      ],
      total: 44.99
    },
    {
      id: "ORD-2024-008",
      date: "2024-11-10",
      status: "delivered",
      items: [
        { id: 9, name: "Component Library", price: 34.99, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop" }
      ],
      total: 34.99
    },
    {
      id: "ORD-2024-009",
      date: "2024-11-05",
      status: "delivered",
      items: [
        { id: 10, name: "Icon Set", price: 24.99, image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop" }
      ],
      total: 24.99
    },
    {
      id: "ORD-2024-010",
      date: "2024-10-30",
      status: "delivered",
      items: [
        { id: 11, name: "Vector Pack", price: 49.99, image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop" }
      ],
      total: 49.99
    },
    {
      id: "ORD-2024-011",
      date: "2024-10-25",
      status: "delivered",
      items: [
        { id: 12, name: "Typography Systems", price: 39.99, image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop" }
      ],
      total: 39.99
    },
    {
      id: "ORD-2024-012",
      date: "2024-10-20",
      status: "delivered",
      items: [
        { id: 13, name: "Color Palettes", price: 29.99, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop" }
      ],
      total: 29.99
    }
  ])

  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      name: "Lumina UI Kit",
      price: 49.99,
      rating: 4.8,
      reviews: 124,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 2,
      name: "3D Character Pack",
      price: 29.99,
      rating: 4.5,
      reviews: 87,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 3,
      name: "VFX Collection",
      price: 39.99,
      rating: 4.6,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 4,
      name: "Glassmorphism Kit",
      price: 49.99,
      rating: 4.7,
      reviews: 95,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 5,
      name: "3D Modeling Pack",
      price: 79.99,
      rating: 4.9,
      reviews: 142,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 6,
      name: "Motion Graphics",
      price: 89.99,
      rating: 4.6,
      reviews: 113,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 7,
      name: "Typography Systems",
      price: 39.99,
      rating: 4.4,
      reviews: 76,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 8,
      name: "Color Palettes Pro",
      price: 29.99,
      rating: 4.8,
      reviews: 98,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 9,
      name: "Shadow Effects",
      price: 19.99,
      rating: 4.5,
      reviews: 54,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 10,
      name: "Gradient Collection",
      price: 24.99,
      rating: 4.7,
      reviews: 82,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 11,
      name: "Pattern Library",
      price: 34.99,
      rating: 4.6,
      reviews: 68,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 12,
      name: "Icon Animations",
      price: 44.99,
      rating: 4.8,
      reviews: 105,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 13,
      name: "UI Interactions",
      price: 59.99,
      rating: 4.9,
      reviews: 127,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 14,
      name: "Layout Templates",
      price: 49.99,
      rating: 4.5,
      reviews: 91,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 15,
      name: "Component Variations",
      price: 69.99,
      rating: 4.7,
      reviews: 134,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 16,
      name: "Design Tools",
      price: 99.99,
      rating: 4.8,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 17,
      name: "Asset Management",
      price: 74.99,
      rating: 4.6,
      reviews: 102,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 18,
      name: "Workflow Automation",
      price: 84.99,
      rating: 4.7,
      reviews: 119,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 19,
      name: "Brand Guidelines",
      price: 54.99,
      rating: 4.5,
      reviews: 77,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 20,
      name: "Prototyping Kit",
      price: 64.99,
      rating: 4.8,
      reviews: 145,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 21,
      name: "User Research",
      price: 44.99,
      rating: 4.4,
      reviews: 63,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    },
    {
      id: 22,
      name: "Analytics Dashboard",
      price: 89.99,
      rating: 4.9,
      reviews: 168,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=300&fit=crop"
    },
    {
      id: 23,
      name: "Export Templates",
      price: 39.99,
      rating: 4.6,
      reviews: 81,
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop"
    },
    {
      id: 24,
      name: "Documentation Kit",
      price: 24.99,
      rating: 4.7,
      reviews: 88,
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=300&h=300&fit=crop"
    }
  ])

  const [downloads] = useState([
    {
      id: 1,
      name: "Lumina UI Kit",
      fileName: "lumina-ui-kit-v2.figma",
      downloadDate: "2024-12-15",
      fileSize: "45.2 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop"
    },
    {
      id: 2,
      name: "3D Character Pack",
      fileName: "3d-character-pack.zip",
      downloadDate: "2024-12-10",
      fileSize: "320.5 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop"
    },
    {
      id: 3,
      name: "VFX Collection",
      fileName: "vfx-collection-pro.zip",
      downloadDate: "2024-12-05",
      fileSize: "156.8 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop"
    },
    {
      id: 4,
      name: "2D Sprite Pack",
      fileName: "2d-sprite-pack-full.zip",
      downloadDate: "2024-12-01",
      fileSize: "78.3 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop"
    },
    {
      id: 5,
      name: "Animation Pack",
      fileName: "animation-pack.zip",
      downloadDate: "2024-11-28",
      fileSize: "234.1 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop"
    },
    {
      id: 6,
      name: "UI Patterns",
      fileName: "ui-patterns.figma",
      downloadDate: "2024-11-25",
      fileSize: "52.3 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop"
    },
    {
      id: 7,
      name: "Design System",
      fileName: "design-system-v3.figma",
      downloadDate: "2024-11-20",
      fileSize: "89.7 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop"
    },
    {
      id: 8,
      name: "Mockup Kit",
      fileName: "mockup-kit-pro.psd",
      downloadDate: "2024-11-18",
      fileSize: "412.5 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop"
    },
    {
      id: 9,
      name: "Component Library",
      fileName: "component-library.figma",
      downloadDate: "2024-11-15",
      fileSize: "67.2 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop"
    },
    {
      id: 10,
      name: "Icon Set",
      fileName: "icon-set-complete.zip",
      downloadDate: "2024-11-12",
      fileSize: "28.4 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop"
    },
    {
      id: 11,
      name: "Vector Pack",
      fileName: "vector-pack-all.ai",
      downloadDate: "2024-11-10",
      fileSize: "198.6 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop"
    },
    {
      id: 12,
      name: "Typography Systems",
      fileName: "typography-systems.zip",
      downloadDate: "2024-11-08",
      fileSize: "156.3 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop"
    },
    {
      id: 13,
      name: "Color Palettes",
      fileName: "color-palettes-master.ase",
      downloadDate: "2024-11-05",
      fileSize: "5.2 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop"
    },
    {
      id: 14,
      name: "Shadow Effects",
      fileName: "shadow-effects.css",
      downloadDate: "2024-11-02",
      fileSize: "0.8 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop"
    },
    {
      id: 15,
      name: "Gradient Collection",
      fileName: "gradient-collection.json",
      downloadDate: "2024-10-30",
      fileSize: "2.1 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1579546929662-711aa33e4565?w=150&h=150&fit=crop"
    },
    {
      id: 16,
      name: "Pattern Library",
      fileName: "pattern-library.zip",
      downloadDate: "2024-10-28",
      fileSize: "87.5 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=150&h=150&fit=crop"
    },
    {
      id: 17,
      name: "Icon Animations",
      fileName: "icon-animations.mp4",
      downloadDate: "2024-10-25",
      fileSize: "245.7 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop"
    },
    {
      id: 18,
      name: "UI Interactions",
      fileName: "ui-interactions.figma",
      downloadDate: "2024-10-22",
      fileSize: "102.3 MB",
      status: "completed",
      image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=150&h=150&fit=crop"
    }
  ])

  const removeFromWishlist = (id) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id))
  }

  const addToWishlist = (item) => {
    const exists = wishlistItems.find(w => w.id === item.id)
    if (!exists) {
      setWishlistItems([...wishlistItems, item])
    }
  }

  return (
    <UserDataContext.Provider
      value={{
        orders,
        wishlistItems,
        removeFromWishlist,
        addToWishlist,
        downloads,
        ordersCount: orders.length,
        wishlistCount: wishlistItems.length,
        downloadsCount: downloads.length
      }}
    >
      {children}
    </UserDataContext.Provider>
  )
}
