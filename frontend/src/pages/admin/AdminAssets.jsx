import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, Loader2, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const toAbsUrl = (url) => {
  if (!url) return null
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`
}

const STATUS_COLORS = {
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  draft:     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  hidden:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  archived:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const STATUSES = ["draft", "pending", "published", "hidden", "archived"]

export default function AdminAssets() {
  const { user: currentUser, getAuthHeaders } = useAuth()
  const { t } = useTranslation()
  const isAdmin = currentUser?.role === "admin"

  const [assets, setAssets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [actionLoading, setActionLoading] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAssets = useCallback(async (pg = 1, q = search, status = filterStatus) => {
    setLoading(true)
    const params = new URLSearchParams({ page: pg, limit: 20 })
    if (q) params.set("search", q)
    if (status) params.set("status", status)
    try {
      const res = await fetch(`${API_BASE}/admin/assets?${params}`, { headers: getAuthHeaders() })
      const json = await res.json()
      setAssets(json.data ?? [])
      setTotal(json.total ?? 0)
      setPages(json.pages ?? 1)
      setPage(json.page ?? 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAssets(1) }, [filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (assetId, status) => {
    setActionLoading(p => ({ ...p, [assetId]: true }))
    try {
      const res = await fetch(`${API_BASE}/admin/assets/${assetId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setAssets(prev => prev.map(a => a._id === assetId ? { ...a, status } : a))
      }
    } finally {
      setActionLoading(p => ({ ...p, [assetId]: false }))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/admin/assets/${deleteTarget._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setAssets(prev => prev.filter(a => a._id !== deleteTarget._id))
        setTotal(t => t - 1)
      }
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.assets.title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("admin.assets.total", { count: total })}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setTimeout(() => fetchAssets(1, e.target.value, filterStatus), 350)
            }}
            placeholder={t("admin.assets.searchPlaceholder")}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none">
          <option value="">{t("admin.assets.allStatuses")}</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">{t("admin.assets.noAssets")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.assets.colAsset")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.assets.colCreator")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.assets.colCategory")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.assets.colPrice")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.assets.colStatus")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {assets.map(a => (
                  <tr key={a._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(() => { const url = toAbsUrl(a.thumbnail_url || a.thumbnailUrl); return url ? (
                          <img src={url}
                            alt={a.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-zinc-100 dark:bg-zinc-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
                        ) })()}
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white line-clamp-1">{a.title}</p>
                          <p className="text-xs text-zinc-400">{a.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {a.creatorId?.username ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {a.categoryId?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      {a.isFree ? t("admin.assets.free") : a.price?.toLocaleString("vi-VN") + " ₫"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex items-center gap-2">
                        {actionLoading[a._id] && <Loader2 size={12} className="animate-spin text-zinc-400" />}
                        <select
                          value={a.status}
                          onChange={e => handleStatusChange(a._id, e.target.value)}
                          disabled={!!actionLoading[a._id]}
                          className={`text-xs px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none ${STATUS_COLORS[a.status]}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition rounded"
                          title="Delete asset"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchAssets(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => fetchAssets(page + 1)} disabled={page >= pages}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t("admin.assets.deleteTitle")}</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-zinc-400 hover:text-zinc-700 transition">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              {t("admin.assets.deleteConfirm", { name: deleteTarget?.title ?? "" })}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                {t("admin.assets.cancel")}
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                {deleting && <Loader2 size={13} className="animate-spin" />}
                {t("admin.assets.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}
