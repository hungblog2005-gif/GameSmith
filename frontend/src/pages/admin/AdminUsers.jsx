import { useEffect, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Search, Loader2, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const toAbsUrl = (url) => {
  if (!url) return null
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`
}

const ROLE_COLORS = {
  admin:     "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  moderator: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  creator:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  user:      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

const STATUS_COLORS = {
  active:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  inactive:  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  suspended: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  banned:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const ROLES = ["user", "creator", "moderator", "admin"]
const STATUSES = ["active", "inactive", "suspended", "banned"]

export default function AdminUsers() {
  const { user: currentUser, getAuthHeaders } = useAuth()
  const { t } = useTranslation()

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const [deleteTarget, setDeleteTarget] = useState(null) // user object
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState({}) // { [userId]: true }

  const searchTimerRef = useRef(null)

  const fetchUsers = useCallback(async (pg = 1, q = search, role = filterRole, status = filterStatus) => {
    setLoading(true)
    const params = new URLSearchParams({ page: pg, limit: 20 })
    if (q) params.set("search", q)
    if (role) params.set("role", role)
    if (status) params.set("status", status)
    try {
      const res = await fetch(`${API_BASE}/admin/users?${params}`, { headers: getAuthHeaders() })
      const json = await res.json()
      setUsers(json.data ?? [])
      setTotal(json.total ?? 0)
      setPages(json.pages ?? 1)
      setPage(json.page ?? 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, filterRole, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers(1)
  }, [filterRole, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => fetchUsers(1, val, filterRole, filterStatus), 350)
  }

  const changePage = (pg) => fetchUsers(pg)

  const handleRoleChange = async (userId, role) => {
    setActionLoading(p => ({ ...p, [userId + "_role"]: true }))
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u))
      }
    } finally {
      setActionLoading(p => ({ ...p, [userId + "_role"]: false }))
    }
  }

  const handleStatusChange = async (userId, status) => {
    setActionLoading(p => ({ ...p, [userId + "_status"]: true }))
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status } : u))
      }
    } finally {
      setActionLoading(p => ({ ...p, [userId + "_status"]: false }))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/admin/users/${deleteTarget._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== deleteTarget._id))
        setTotal(t => t - 1)
      }
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const isSelf = (id) => id === currentUser?._id || id === currentUser?.id

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.users.title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("admin.users.total", { count: total })}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t("admin.users.searchPlaceholder")}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none">
          <option value="">{t("admin.users.allRoles")}</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none">
          <option value="">{t("admin.users.allStatuses")}</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">{t("admin.users.noUsers")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.users.colUser")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.users.colRole")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.users.colStatus")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.users.colJoined")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map(u => {
                  const self = isSelf(u._id)
                  const isAdmin = u.role === "admin"
                  const locked = self || isAdmin
                  return (
                    <tr key={u._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={toAbsUrl(u.avatar_url) || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"}
                            alt={u.username}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{u.username}</p>
                            <p className="text-xs text-zinc-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {locked ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                            {u.role}
                          </span>
                        ) : (
                          <div className="relative">
                            {actionLoading[u._id + "_role"] && (
                              <Loader2 size={12} className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />
                            )}
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u._id, e.target.value)}
                              disabled={!!actionLoading[u._id + "_role"]}
                              className={`text-xs px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none ${ROLE_COLORS[u.role]}`}
                            >
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {locked ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status]}`}>
                            {u.status}
                          </span>
                        ) : (
                          <div className="relative">
                            {actionLoading[u._id + "_status"] && (
                              <Loader2 size={12} className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />
                            )}
                            <select
                              value={u.status}
                              onChange={e => handleStatusChange(u._id, e.target.value)}
                              disabled={!!actionLoading[u._id + "_status"]}
                              className={`text-xs px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none ${STATUS_COLORS[u.status]}`}
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {!locked && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 transition rounded"
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">{t("admin.users.page", { page, pages })}</p>
          <div className="flex gap-2">
            <button
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => changePage(page + 1)}
              disabled={page >= pages}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t("admin.users.deleteTitle")}</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-zinc-400 hover:text-zinc-700 transition">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              {t("admin.users.deleteConfirm", { name: deleteTarget?.username ?? "" })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                {t("admin.users.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
