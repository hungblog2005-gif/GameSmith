import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Grid3x3, ChevronRight } from "lucide-react"

export default function Categories() {
  const { t } = useTranslation()
  
  const categories = [
    {
      id: "all",
      label: t("sidebar.allAssets"),
      count: 8,
      icon: "🎨",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "2d",
      label: t("sidebar.2dAssets"),
      count: 2,
      icon: "🖼️",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "3d",
      label: t("sidebar.3dAssets"),
      count: 2,
      icon: "🎭",
      color: "from-orange-500 to-red-500"
    },
    {
      id: "ui",
      label: t("sidebar.uiKits"),
      count: 2,
      icon: "✨",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "audio",
      label: t("sidebar.audio"),
      count: 1,
      icon: "🎵",
      color: "from-indigo-500 to-purple-500"
    },
    {
      id: "vfx",
      label: t("sidebar.vfx"),
      count: 2,
      icon: "⚡",
      color: "from-yellow-500 to-orange-500"
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("categories.allCategories")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Explore our comprehensive collection of game assets
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/browse-all?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md dark:hover:shadow-none transition cursor-pointer"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{category.icon}</span>
                  <ChevronRight 
                    size={24} 
                    className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition transform group-hover:translate-x-1"
                  />
                </div>
                
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  {category.label}
                </h3>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {category.count} {category.count === 1 ? "asset" : "assets"}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Featured Section */}
        <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
            Featured Collections
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-none transition">
              <img
                src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=300&fit=crop"
                alt="UI Kits Collection"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  UI Kits Collection
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Beautiful, modern UI components for your projects
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-none transition">
              <img
                src="https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600&h=300&fit=crop"
                alt="3D Assets Collection"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  3D Assets Collection
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Professional 3D models and character packs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
