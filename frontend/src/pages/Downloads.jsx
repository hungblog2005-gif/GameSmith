import { useState, useEffect } from 'react'
import { Download, Loader2, AlertCircle, Grid, List, ChevronDown, ChevronUp, FileArchive } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState('grid')
  // { [assetId]: { files, version, loading, open } }
  const [fileStates, setFileStates] = useState({})

  // Fetch purchased assets
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Single endpoint returns all purchased assets—no N+1 fetch
    fetch(`${API_BASE}/users/my-assets?page=1&limit=100`, {
      headers: getAuthHeaders(),
    })
      .then((r) => {
        if (r.status === 401) {
          navigate('/login')
          return Promise.reject('unauthorized')
        }
        return r.ok ? r.json() : Promise.reject(r.status)
      })
      .then((data) => {
        setPurchasedAssets(data.assets ?? data)
      })
      .catch((err) => {
        if (err === 'unauthorized') return
        console.error('Fetch error:', err)
        setError(t('downloads.loadError'))
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleDownload = async (assetId) => {
    const authHeaders = getAuthHeaders()
    if (!authHeaders.Authorization) { navigate('/login'); return }

    // Toggle collapse if already loaded
    if (fileStates[assetId]?.files) {
      setFileStates(prev => ({ ...prev, [assetId]: { ...prev[assetId], open: !prev[assetId].open } }))
      return
    }

    setFileStates(prev => ({ ...prev, [assetId]: { loading: true, open: true } }))
    try {
      const res = await fetch(`${API_BASE}/assets/${assetId}/download`, { headers: authHeaders })

      if (res.status === 401) { navigate('/login'); return }
      if (res.status === 403) {
        setFileStates(prev => ({ ...prev, [assetId]: { loading: false, open: false, error: t('downloads.notPurchased') || 'Not purchased' } }))
        return
      }
      if (res.status === 400) {
        setFileStates(prev => ({ ...prev, [assetId]: { loading: false, open: false, error: t('downloads.fileNotReady') || 'Files not ready yet' } }))
        return
      }
      if (!res.ok) throw new Error(`Status ${res.status}`)

      const { files, version } = await res.json()
      setFileStates(prev => ({ ...prev, [assetId]: { loading: false, open: true, files, version } }))
    } catch (err) {
      console.error('Download error:', err)
      setFileStates(prev => ({ ...prev, [assetId]: { loading: false, open: false, error: t('downloads.downloadError') || 'Failed' } }))
    }
  }

  const triggerFileDownload = (url, filename) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Format badge color by type
  const formatBadge = (fmt) => {
    const f = fmt?.toLowerCase() ?? ''
    if (['unitypackage', 'unity'].includes(f)) return 'bg-zinc-700 text-white'
    if (['blend', 'blender'].includes(f)) return 'bg-orange-600 text-white'
    if (['c4d'].includes(f)) return 'bg-sky-600 text-white'
    if (['ma', 'mb', 'maya'].includes(f)) return 'bg-blue-700 text-white'
    if (['max', '3ds'].includes(f)) return 'bg-indigo-700 text-white'
    if (['fbx', 'obj', 'glb', 'gltf', 'stl', 'dae', 'abc'].includes(f)) return 'bg-emerald-700 text-white'
    if (['zip', 'rar', '7z', 'tar'].includes(f)) return 'bg-yellow-600 text-white'
    if (['png', 'psd', 'tga', 'jpg', 'jpeg'].includes(f)) return 'bg-pink-600 text-white'
    return 'bg-zinc-600 text-white'
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
            {purchasedAssets.map((asset) => {
              const fs = fileStates[asset._id] ?? {}
              return (
                <div
                  key={asset._id}
                  className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition duration-300 flex flex-col"
                >
                  {/* Thumbnail */}
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
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{asset.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{asset.category?.name || 'Category'}</p>
                    <span className="mt-1 inline-block text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono w-fit">
                      v{asset.version ?? '1.0.0'}
                    </span>

                    {/* Error */}
                    {fs.error && (
                      <p className="mt-2 text-xs text-red-500">{fs.error}</p>
                    )}

                    {/* File list (expanded) */}
                    {fs.open && fs.files && (
                      <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
                        {fs.files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${formatBadge(f.format)}`}>
                              {f.format}
                            </span>
                            <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 truncate">{f.filename}</span>
                            {f.fileSize && <span className="text-[10px] text-zinc-400">{f.fileSize}</span>}
                            <button
                              onClick={() => triggerFileDownload(f.downloadUrl, f.filename)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition"
                              title={`Download ${f.filename}`}
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toggle button */}
                    <button
                      onClick={() => handleDownload(asset._id)}
                      disabled={fs.loading}
                      className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition disabled:opacity-50"
                    >
                      {fs.loading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : fs.open && fs.files ? (
                        <><ChevronUp size={15} />{t('downloads.hideFiles') || 'Hide files'}</>
                      ) : (
                        <><Download size={15} />{t('downloads.showFiles') || 'Download'}</>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && purchasedAssets.length > 0 && (
          <div className="space-y-3">
            {purchasedAssets.map((asset) => {
              const fs = fileStates[asset._id] ?? {}
              return (
                <div key={asset._id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                    {/* Thumbnail */}
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{asset.title}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{asset.category?.name || 'Category'}</p>
                      <span className="inline-block mt-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">
                        v{asset.version ?? '1.0.0'}
                      </span>
                      {fs.error && <p className="mt-1 text-xs text-red-500">{fs.error}</p>}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleDownload(asset._id)}
                      disabled={fs.loading}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                    >
                      {fs.loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : fs.open && fs.files ? (
                        <><ChevronUp size={16} />{t('downloads.hideFiles') || 'Hide'}</>
                      ) : (
                        <><Download size={16} />{t('downloads.showFiles') || 'Download'}</>
                      )}
                    </button>
                  </div>

                  {/* Expanded file list */}
                  {fs.open && fs.files && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 space-y-2 bg-zinc-50 dark:bg-zinc-900/50">
                      {fs.files.map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${formatBadge(f.format)}`}>
                            {f.format}
                          </span>
                          <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{f.filename}</span>
                          {f.fileSize && <span className="text-xs text-zinc-400">{f.fileSize}</span>}
                          <button
                            onClick={() => triggerFileDownload(f.downloadUrl, f.filename)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs transition"
                          >
                            <Download size={13} />
                            {t('downloads.download') || 'Download'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
