import { useState, useEffect } from 'react'
import { Download, Loader2, AlertCircle, Grid, List } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Downloads Page
 * Hiển thị danh sách tất cả assets đã mua của user
 * User có thể xem thông tin chi tiết và tải xuống file
 */
export default function Downloads() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, getAuthHeaders } = useAuth()
  const [purchasedAssets, setPurchasedAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Fetch purchased assets
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Fetch user's purchased assets
    fetch(`${API_BASE}/users/${user.id}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((userData) => {
        if (userData?.purchased_assets && userData.purchased_assets.length > 0) {
          // Fetch details for each asset
          Promise.all(
            userData.purchased_assets.map((assetId) =>
              fetch(`${API_BASE}/assets/${assetId}`).then((r) => (r.ok ? r.json() : null))
            )
          )
            .then((assets) => {
              setPurchasedAssets(assets.filter(Boolean))
            })
            .finally(() => setLoading(false))
        } else {
          setPurchasedAssets([])
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        setError(t('downloads.loadError'))
        setLoading(false)
      })
  }, [user])

  const handleDownload = (assetId, assetTitle) => {
    setDownloadingId(assetId)
    try {
      // Open download in new tab
      window.open(`${API_BASE}/assets/${assetId}/download`, '_blank')
      setTimeout(() => setDownloadingId(null), 2000)
    } catch (error) {
      console.error('Download error:', error)
      setDownloadingId(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Download size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t('downloads.loginRequired') || 'Vui lòng đăng nhập để xem tải xuống'}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
          >
            {t('navbar.login')}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-6 sm:pt-8 flex justify-center items-center h-96">
        <Loader2 size={40} className="animate-spin text-zinc-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-6 sm:pt-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            {t('downloads.myDownloads') || 'Tải xuống'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {purchasedAssets.length} {t('downloads.assets') || 'sản phẩm'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Empty State */}
        {purchasedAssets.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              {t('downloads.emptyDownloads')}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {t('downloads.emptyDesc')}
            </p>
            <a
              href="/browse-all"
              className="inline-block px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {t('downloads.browse')}
            </a>
          </div>
        )}

        {/* View Mode Toggle */}
        {purchasedAssets.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {purchasedAssets.length} {t('downloads.items')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition ${
                  viewMode === 'grid'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition ${
                  viewMode === 'list'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && purchasedAssets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchasedAssets.map((asset) => (
              <div
                key={asset._id}
                className="group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition duration-300"
              >
                {/* Image */}
                <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-square">
                  <img
                    src={
                      asset.thumbnail_url
                        ? asset.thumbnail_url.startsWith('/')
                          ? `${API_BASE}${asset.thumbnail_url}`
                          : asset.thumbnail_url
                        : 'https://placehold.co/400x400?text=No+Image'
                    }
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handleDownload(asset._id, asset.title)}
                      disabled={downloadingId === asset._id}
                      className="opacity-0 group-hover:opacity-100 transition duration-300 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {downloadingId === asset._id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          {t('downloads.download')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                    {asset.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {asset.category?.name || 'Category'}
                  </p>
                  {asset.file_format && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {asset.file_format.slice(0, 2).map((format) => (
                        <span
                          key={format}
                          className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && purchasedAssets.length > 0 && (
          <div className="space-y-3">
            {purchasedAssets.map((asset) => (
              <div
                key={asset._id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition"
              >
                {/* Image */}
                <div className="w-16 h-16 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                  <img
                    src={
                      asset.thumbnail_url
                        ? asset.thumbnail_url.startsWith('/')
                          ? `${API_BASE}${asset.thumbnail_url}`
                          : asset.thumbnail_url
                        : 'https://placehold.co/64x64?text=No+Image'
                    }
                    alt={asset.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    {asset.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {asset.category?.name || 'Category'} • {asset.file_format?.join(', ') || 'Files'}
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(asset._id, asset.title)}
                  disabled={downloadingId === asset._id}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                >
                  {downloadingId === asset._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloadingId === asset._id
                    ? t('downloads.downloading')
                    : t('downloads.download')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
