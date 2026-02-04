import AssetCard from "../components/AssetCard"

const assets = [
  {
    id: 1,
    title: "Pixel Sword Pack",
    price: 12,
    image: "https://placehold.co/400x300",
    tag: "2D"
  },
  {
    id: 2,
    title: "Fantasy Icons",
    price: 8,
    image: "https://placehold.co/400x300",
    tag: "UI"
  },
]

export default function Home() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="mb-8">Game Assets</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  )
}
