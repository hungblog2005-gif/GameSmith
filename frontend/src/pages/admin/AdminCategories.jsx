import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Pencil, Trash2, Loader2, X, ChevronRight } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

function CategoryModal({ mode, initial, categories, onSave, onClose, saving }) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [parentId, setParentId] = useState(initial?.parentId ?? "")

  const roots = categories.filter(c => !c.parentId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {mode === "create" ? t("admin.categories.createTitle") : t("admin.categories.editTitle")}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.categories.fieldName")}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 3D Models"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.categories.fieldDesc")}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.categories.fieldParent")}</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
            >
              <option value="">{t("admin.categories.parentNone")}</option>
              {roots.filter(c => c._id !== initial?._id).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
            {t("admin.categories.cancel")}
          </button>
          <button
            onClick={() => onSave({ name: name.trim(), description: description.trim(), parentId: parentId || undefined })}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {mode === "create" ? t("admin.categories.create") : t("admin.categories.save")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCategories() {
  const { getAuthHeaders } = useAuth()
  const { t } = useTranslation()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { mode: 'create'|'edit', data?: cat }
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/categories`, { headers: getAuthHeaders() })
      const json = await res.json()
      setCategories(Array.isArray(json) ? json : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (dto) => {
    setSaving(true)
    try {
      if (modal.mode === "create") {
        const res = await fetch(`${API_BASE}/admin/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(dto),
        })
        if (res.ok) { await fetchCategories(); setModal(null) }
      } else {
        const res = await fetch(`${API_BASE}/admin/categories/${modal.data._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(dto),
        })
        if (res.ok) { await fetchCategories(); setModal(null) }
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${deleteTarget._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setCategories(prev => prev.filter(c => c._id !== deleteTarget._id))
        setDeleteTarget(null)
      } else {
        const err = await res.json()
        alert(err.message ?? "Cannot delete category")
      }
    } finally {
      setDeleting(false)
    }
  }

  const roots = categories.filter(c => !c.parentId)
  const childrenMap = {}
  categories.forEach(c => {
    if (c.parentId) {
      const pid = typeof c.parentId === "object" ? (c.parentId._id ?? c.parentId.toString()) : c.parentId
      if (!childrenMap[pid]) childrenMap[pid] = []
      childrenMap[pid].push(c)
    }
  })

  const renderRow = (cat, depth = 0) => (
    <div key={cat._id}>
      <div className={`flex items-center justify-between py-2.5 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition ${depth > 0 ? "border-l-2 border-violet-200 dark:border-violet-800 ml-6" : ""}`}>
        <div className="flex items-center gap-2 min-w-0">
          {depth > 0 && <ChevronRight size={13} className="text-zinc-400 flex-shrink-0" />}
          <span className="font-medium text-zinc-900 dark:text-white text-sm">{cat.name}</span>
          {cat.assetCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {t("admin.categories.assetsCount", { count: cat.assetCount })}
            </span>
          )}
          {!cat.isActive && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {t("admin.categories.inactive")}
            </span>
          )}
          {cat.description && (
            <span className="text-xs text-zinc-400 truncate hidden sm:block max-w-xs">{cat.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setModal({ mode: "edit", data: cat })}
            className="p-1.5 text-zinc-400 hover:text-violet-600 transition rounded"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setDeleteTarget(cat)}
            disabled={cat.assetCount > 0}
            className="p-1.5 text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition rounded"
            title={cat.assetCount > 0 ? "Cannot delete: has assets" : "Delete"}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {(childrenMap[cat._id] ?? []).map(child => renderRow(child, depth + 1))}
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.categories.title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("admin.categories.total", { count: categories.length })}</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={15} />
          {t("admin.categories.newBtn")}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">{t("admin.categories.noCategories")}</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {roots.map(cat => renderRow(cat))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <CategoryModal
          mode={modal.mode}
          initial={modal.data}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t("admin.categories.deleteTitle")}</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-zinc-400 hover:text-zinc-700 transition">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              {t("admin.categories.deleteConfirm", { name: deleteTarget?.name ?? "" })}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                {t("admin.categories.cancel")}
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                {deleting && <Loader2 size={13} className="animate-spin" />}
                {t("admin.categories.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
