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
    <div className="bg-white dark:bg-zinc-950">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
          <button
            className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-left"
            onClick={() => navigate(`/product/${selectedAssetId}`)}
          >
            <img
              src={selectedAsset?.image}
              alt={selectedAsset?.title}
              className="w-full h-full object-cover min-h-[320px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">{t("home.featured")}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {selectedAsset?.title}
              </h2>
              <p className="mt-2 text-sm text-white/80 max-w-xl">
                {selectedAsset?.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/product/${selectedAssetId}`)
                  }}
                  className="h-10 px-4 rounded-lg bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition"
                >
                  {t("home.viewDetails")}
                </button>
                <button
                  className="h-10 px-4 rounded-lg border border-white/40 text-white text-sm font-semibold hover:border-white/70 transition inline-flex items-center gap-2"
                >
                  <Heart size={16} />
                  {t("home.save")}
                </button>
              </div>
            </div>
          </button>

          <div className="flex flex-col gap-3">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${
                  selectedAssetId === asset.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                }`}
              >
                <img
                  src={asset.smallImage}
                  alt={asset.title}
                  className="w-12 h-16 rounded-md object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {asset.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{asset.tag}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Assets Grid Section */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl">{t("home.title")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {t("home.curatedSubtitle")}
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
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
              className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 transition"
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
