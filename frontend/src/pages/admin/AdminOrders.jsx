import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const toAbsUrl = (url) => {
  if (!url) return null
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`
}

const ORDER_STATUS_COLORS = {
  completed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cancelled:  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  refunded:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const PAY_STATUS_COLORS = {
  paid:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  failed:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  refunded: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled", "refunded"]

export default function AdminOrders() {
  const { getAuthHeaders } = useAuth()
  const { t } = useTranslation()

  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const fetchOrders = useCallback(async (pg = 1, q = search, status = filterStatus) => {
    setLoading(true)
    const params = new URLSearchParams({ page: pg, limit: 20 })
    if (q) params.set("search", q)
    if (status) params.set("status", status)
    try {
      const res = await fetch(`${API_BASE}/admin/orders?${params}`, { headers: getAuthHeaders() })
      const json = await res.json()
      setOrders(json.data ?? [])
      setTotal(json.total ?? 0)
      setPages(json.pages ?? 1)
      setPage(json.page ?? 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOrders(1) }, [filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.orders.title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("admin.orders.total", { count: total })}</p>
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
              setTimeout(() => fetchOrders(1, e.target.value, filterStatus), 350)
            }}
            placeholder={t("admin.orders.searchPlaceholder")}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none">
          <option value="">{t("admin.orders.allStatuses")}</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">{t("admin.orders.noOrders")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colOrder")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colUser")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colItems")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colTotal")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colStatus")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colPayment")}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("admin.orders.colDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {o.userId?.avatar_url && (
                          <img src={toAbsUrl(o.userId.avatar_url)} alt={o.userId.username}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-zinc-800 dark:text-zinc-200">{o.userId?.username ?? "—"}</p>
                          <p className="text-xs text-zinc-400">{o.userId?.email ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {o.items?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-medium">
                      {o.totalAmount?.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PAY_STATUS_COLORS[o.paymentStatus] ?? ""}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
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
          <p className="text-sm text-zinc-500">{t("admin.orders.page", { page, pages })}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchOrders(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => fetchOrders(page + 1)} disabled={page >= pages}
              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
