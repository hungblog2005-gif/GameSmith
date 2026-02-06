import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart } from "lucide-react"
import AssetCard from "../components/product/AssetCard"

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedAssetId, setSelectedAssetId] = useState(1)

  const assets = [
    {
      id: 1,
      title: "Pixel Sword Pack",
      price: 12,
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=500&fit=crop",
      smallImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&h=150&fit=crop",
      tag: "2D",
      category: "2d",
      description: "Bộ kiếm pixel art chuyên nghiệp với 50+ thiết kế độc đáo cho game 2D của bạn.",
    },
    {
      id: 2,
      title: "Fantasy Icons",
      price: 8,
      image: "https://images.unsplash.com/photo-1614726365723-49cfae92782f?w=1200&h=500&fit=crop",
      smallImage: "https://images.unsplash.com/photo-1614726365723-49cfae92782f?w=100&h=150&fit=crop",
      tag: "UI",
      category: "ui",
      description: "Bộ icon fantasy đầy màu sắc, hoàn hảo cho menu game và giao diện người dùng.",
    },
    {
      id: 3,
      title: "Low Poly Trees",
      price: 15,
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=500&fit=crop",
      smallImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=150&fit=crop",
      tag: "3D",
      category: "3d",
      description: "Mô hình cây Low Poly tối ưu hóa cho game 3D hiệu suất cao.",
    },
    {
      id: 4,
      title: "RPG Soundpack",
      price: 20,
      image: "https://images.unsplash.com/photo-1642425149556-b6f90e946859?w=1200&h=500&fit=crop",
      smallImage: "https://images.unsplash.com/photo-1642425149556-b6f90e946859?w=100&h=150&fit=crop",
      tag: "Audio",
      category: "audio",
      description: "Bộ âm thanh RPG chuyên nghiệp bao gồm nhạc nền, hiệu ứng âm thanh và voice.",
    },
    {
      id: 5,
      title: "Particle Effects Bundle",
      price: 25,
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&h=500&fit=crop",
      smallImage: "https://images.unsplash.com/photo-1563089145-599997674d42?w=100&h=150&fit=crop",
      tag: "VFX",
      category: "vfx",
      description: "Bộ hiệu ứng hạt tuyệt vời cho các hiệu ứng thị giác game.",
    },
    {
      id: 6,
      title: "Modern UI Elements",
      price: 18,
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=500&fit=crop",
      smallImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=150&fit=crop",
      tag: "UI",
      category: "ui",
      description: "Gói phần tử UI hiện đại với thiết kế minimalist chuyên nghiệp.",
    },
  ]

  const selectedAsset = assets.find(a => a.id === selectedAssetId)

  return (
    <div>
      {/* Hero Section */}
      <section className="px-6 py-4">
        <div className="hero-wrapper">
          {/* Main Hero Image */}
          <div 
            className="hero-main dark:bg-zinc-800 cursor-pointer hover:opacity-90 transition"
            onClick={() => navigate(`/product/${selectedAssetId}`)}
          >
            <div 
              className="hero-bg"
              style={{
                backgroundImage: `url('${selectedAsset?.image}')`,
              }}
            />
            <div className="hero-overlay">
              <div className="game-info">
                <span className="hero-status">NOW AVAILABLE</span>
                <h2 style={{ marginBottom: "12px" }}>{selectedAsset?.title}</h2>
                <p className="hero-description">
                  {selectedAsset?.description}
                </p>
                <div className="hero-btns">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/product/${selectedAssetId}`)
                    }}
                    className="btn-primary-hero"
                  >
                    Buy Now
                  </button>
                  <button className="btn-secondary-hero">
                    <Heart size={18} />
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hero List (Right) */}
          <div className="hero-list">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`list-item ${selectedAssetId === asset.id ? "active" : ""}`}
              >
                <div
                  className="list-thumb"
                  style={{
                    backgroundImage: `url('${asset.smallImage}')`,
                  }}
                />
                <div className="list-text">{asset.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assets Grid Section */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="mb-8">{t("home.title")}</h2>

        {/* Category Filter */}
        <div className="flex gap-3 flex-wrap mb-8">
          {[
            { id: "all", name: t("sidebar.allAssets"), value: "all" },
            { id: "2d", name: t("sidebar.2dAssets"), value: "2d" },
            { id: "3d", name: t("sidebar.3dAssets"), value: "3d" },
            { id: "ui", name: t("sidebar.uiKits"), value: "ui" },
            { id: "audio", name: t("sidebar.audio"), value: "audio" },
            { id: "vfx", name: t("sidebar.vfx"), value: "vfx" },
          ].map((category) => (
            <button
              key={category.id}
              className="px-4 py-2 rounded-lg font-medium transition-all bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700"
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </section>
    </div>
  )
}
