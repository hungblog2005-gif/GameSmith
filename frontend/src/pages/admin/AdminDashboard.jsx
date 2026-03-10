import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Users, Package, ShoppingBag, DollarSign,
  TrendingUp, Clock, CheckCircle, Loader2, RefreshCw, Brain, AlertCircle,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {value ?? "—"}
          </p>
          {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function fmtVnd(n) {
  if (!n) return "0 ₫"
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B ₫"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M ₫"
  return n.toLocaleString("vi-VN") + " ₫"
}

export default function AdminDashboard() {
  const { getAuthHeaders } = useAuth()
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reindexState, setReindexState] = useState("idle") // idle | loading | success | error
  const [reindexCount, setReindexCount] = useState(null)

  const handleReindex = async () => {
    setReindexState("loading")
    setReindexCount(null)
    try {
      const res = await fetch(`${API_BASE}/recommendations/admin/reindex`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setReindexCount(data?.indexed ?? 0)
      setReindexState("success")
    } catch {
      setReindexState("error")
    }
  }

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-zinc-400" size={28} />
      </div>
    )
  }

  const u = stats?.users ?? {}
  const a = stats?.assets ?? {}
  const o = stats?.orders ?? {}

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.dashboard.title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("admin.dashboard.subtitle")}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t("admin.dashboard.totalUsers")}
          value={u.total?.toLocaleString()}
          sub={`${u.byRole?.creator ?? 0} creators · ${u.byRole?.admin ?? 0} admins`}
          icon={Users}
          color="bg-violet-500"
        />
        <StatCard
          label={t("admin.dashboard.totalAssets")}
          value={a.total?.toLocaleString()}
          sub={`${a.byStatus?.published ?? 0} ${t("admin.dashboard.published")} · ${a.byStatus?.pending ?? 0} ${t("admin.dashboard.pending")}`}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          label={t("admin.dashboard.totalOrders")}
          value={o.total?.toLocaleString()}
          sub={`${o.byStatus?.completed ?? 0} ${t("admin.dashboard.completed")} · ${o.byStatus?.pending ?? 0} ${t("admin.dashboard.pending")}`}
          icon={ShoppingBag}
          color="bg-emerald-500"
        />
        <StatCard
          label={t("admin.dashboard.revenue")}
          value={fmtVnd(o.revenue)}
          sub={t("admin.dashboard.revenueSub")}
          icon={DollarSign}
          color="bg-amber-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* AI Re-index card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
          <Brain size={15} className="text-violet-500" />
          {t("admin.dashboard.aiIndex")}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{t("admin.dashboard.aiIndexDesc")}</p>
        <button
          onClick={handleReindex}
          disabled={reindexState === "loading"}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
        >
          {reindexState === "loading"
            ? <Loader2 size={14} className="animate-spin" />
            : <RefreshCw size={14} />}
          {reindexState === "loading" ? t("admin.dashboard.aiIndexing") : t("admin.dashboard.aiIndexBtn")}
        </button>
        {reindexState === "success" && (
          <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle size={13} />
            {t("admin.dashboard.aiIndexOk", { count: reindexCount })}
          </p>
        )}
        {reindexState === "error" && (
          <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle size={13} />
            {t("admin.dashboard.aiIndexErr")}
          </p>
        )}
      </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Package size={15} className="text-blue-500" />
            {t("admin.dashboard.assetsByStatus")}
          </h2>
          <div className="space-y-2">
            {[
              ["published", "bg-emerald-500", t("admin.dashboard.published")],
              ["pending", "bg-amber-500", t("admin.dashboard.pendingReview")],
              ["draft", "bg-zinc-400", t("admin.dashboard.draft")],
              ["hidden", "bg-orange-400", t("admin.dashboard.hidden")],
              ["archived", "bg-red-400", t("admin.dashboard.archived")],
            ].map(([key, color, label]) => {
              const count = a.byStatus?.[key] ?? 0
              const pct = a.total ? Math.round((count / a.total) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-28">{label}</span>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={15} className="text-emerald-500" />
            {t("admin.dashboard.ordersByStatus")}
          </h2>
          <div className="space-y-2">
            {[
              ["completed", "bg-emerald-500", t("admin.dashboard.completed")],
              ["pending", "bg-amber-500", t("admin.dashboard.pending")],
              ["processing", "bg-blue-500", t("admin.dashboard.processing")],
              ["cancelled", "bg-zinc-400", t("admin.dashboard.cancelled")],
              ["refunded", "bg-red-400", t("admin.dashboard.refunded")],
            ].map(([key, color, label]) => {
              const count = o.byStatus?.[key] ?? 0
              const pct = o.total ? Math.round((count / o.total) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-28">{label}</span>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
