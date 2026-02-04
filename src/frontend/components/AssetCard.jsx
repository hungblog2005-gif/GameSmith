export default function AssetCard({ asset }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
      <img
        src={asset.image}
        alt={asset.title}
        className="h-48 w-full object-cover"
      />

      <div className="p-4 space-y-2">
        <h3>{asset.title}</h3>

        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-500">{asset.tag}</span>
          <span className="font-semibold">${asset.price}</span>
        </div>
      </div>
    </div>
  )
}
