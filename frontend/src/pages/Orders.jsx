import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import {
  Package, Plus, Edit3, Trash2, Upload, X, Eye, EyeOff,
  Loader2, Image, DollarSign, Tag, Search, Filter
} from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const INITIAL_FORM = {
  title: "",
  description: "",
  short_description: "",
  price: "",
  discount_percentage: "",
  is_free: false,
  categoryId: "",
  thumbnail_url: "",
  tags: "",
  file_format: "",
  license_type: "personal",
  status: "draft",
}

export default function Orders() {
  const { t } = useTranslation()
  const { user, getAuthHeaders } = useAuth()

  const [myAssets, setMyAssets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch user's assets + categories
  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      fetch(`${API_BASE}/assets/creator/${user.id}`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/categories`).then(r => r.ok ? r.json() : []),
    ]).then(([assets, cats]) => {
      setMyAssets(assets)
      setCategories(cats)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`${API_BASE}/assets/upload-thumbnail`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      })
      if (res.ok) {
        const { url } = await res.json()
        setForm(prev => ({ ...prev, thumbnail_url: url }))
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (asset) => {
    setForm({
      title: asset.title || "",
      description: asset.description || "",
      short_description: asset.short_description || "",
      price: asset.price?.toString() || "",
      discount_percentage: asset.discount_percentage?.toString() || "",
      is_free: asset.is_free || false,
      categoryId: asset.category?._id || asset.category || "",
      thumbnail_url: asset.thumbnail_url || "",
      tags: (asset.tags || []).join(", "),
      file_format: (asset.file_format || []).join(", "),
      license_type: asset.license_type || "personal",
      status: asset.status || "draft",
    })
    setEditingId(asset._id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)

    const payload = {
      title: form.title,
      description: form.description,
      short_description: form.short_description,
      price: parseFloat(form.price) || 0,
      discount_percentage: parseFloat(form.discount_percentage) || 0,
      is_free: form.is_free,
      categoryId: form.categoryId,
      creatorId: user.id,
      thumbnail_url: form.thumbnail_url,
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      file_format: form.file_format.split(",").map(s => s.trim()).filter(Boolean),
      license_type: form.license_type,
      status: form.status,
    }

    try {
      let res
      if (editingId) {
        res = await fetch(`${API_BASE}/assets/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`${API_BASE}/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        const saved = await res.json()
        if (editingId) {
          setMyAssets(prev => prev.map(a => a._id === editingId ? saved : a))
        } else {
          setMyAssets(prev => [saved, ...prev])
        }
        resetForm()
      }
    } catch (err) {
      console.error("Submit failed:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (assetId) => {
    if (!confirm(t("orders.confirmDelete"))) return
    try {
      const res = await fetch(`${API_BASE}/assets/${assetId}?creatorId=${user.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setMyAssets(prev => prev.filter(a => a._id !== assetId))
      }
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
      case "draft": return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
      case "inactive": return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      default: return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
    }
  }

  const filteredAssets = myAssets.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false
    if (searchQuery && !a.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("orders.loginRequired")}</p>
          <a href="/login" className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition">
            {t("navbar.login")}
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
              {t("orders.myProducts")}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("orders.myProductsDesc")} ({myAssets.length})
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
          >
            <Plus size={18} />
            {t("orders.addProduct")}
          </button>
        </div>

        {/* Upload Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {editingId ? t("orders.editProduct") : t("orders.addProduct")}
                </h2>
                <button onClick={resetForm} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {t("orders.thumbnail")}
                  </label>
                  <div className="flex items-start gap-4">
                    {form.thumbnail_url ? (
                      <div className="relative">
                        <img
                          src={form.thumbnail_url.startsWith("/") ? `${API_BASE}${form.thumbnail_url}` : form.thumbnail_url}
                          alt="Thumbnail"
                          className="w-24 h-24 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange("thumbnail_url", "")}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                        {uploading ? (
                          <Loader2 size={20} className="animate-spin text-zinc-400" />
                        ) : (
                          <>
                            <Image size={20} className="text-zinc-400 mb-1" />
                            <span className="text-xs text-zinc-500">{t("orders.upload")}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("orders.productTitle")} *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => handleChange("title", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                    placeholder={t("orders.titlePlaceholder")}
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("orders.shortDesc")}
                  </label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={e => handleChange("short_description", e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                    placeholder={t("orders.shortDescPlaceholder")}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("orders.description")}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => handleChange("description", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 resize-none"
                    placeholder={t("orders.descPlaceholder")}
                  />
                </div>

                {/* Price + Discount Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.price")} ($) *
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={e => handleChange("price", e.target.value)}
                        required={!form.is_free}
                        disabled={form.is_free}
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 disabled:opacity-50"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.discount")} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_percentage}
                      onChange={e => handleChange("discount_percentage", e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Free + Category Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="is_free"
                      checked={form.is_free}
                      onChange={e => handleChange("is_free", e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <label htmlFor="is_free" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("orders.freeAsset")}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.category")} *
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={e => handleChange("categoryId", e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                    >
                      <option value="">{t("orders.selectCategory")}</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags + File Format */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.tags")}
                    </label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="text"
                        value={form.tags}
                        onChange={e => handleChange("tags", e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                        placeholder="3D, character, game"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.fileFormat")}
                    </label>
                    <input
                      type="text"
                      value={form.file_format}
                      onChange={e => handleChange("file_format", e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                      placeholder="FBX, OBJ, PNG"
                    />
                  </div>
                </div>

                {/* License + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.licenseType")}
                    </label>
                    <select
                      value={form.license_type}
                      onChange={e => handleChange("license_type", e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                    >
                      <option value="personal">{t("orders.licensePersonal")}</option>
                      <option value="commercial">{t("orders.licenseCommercial")}</option>
                      <option value="extended">{t("orders.licenseExtended")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("orders.status")}
                    </label>
                    <select
                      value={form.status}
                      onChange={e => handleChange("status", e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                    >
                      <option value="draft">{t("orders.statusDraft")}</option>
                      <option value="active">{t("orders.statusActive")}</option>
                      <option value="inactive">{t("orders.statusInactive")}</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {editingId ? t("common.save") : t("orders.publish")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder={t("orders.searchProducts")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "draft", "inactive"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  filterStatus === status
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {status === "all" ? t("orders.filterAll") : t(`orders.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{myAssets.length}</p>
            <p className="text-sm text-zinc-500">{t("orders.totalProducts")}</p>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{myAssets.filter(a => a.status === "active").length}</p>
            <p className="text-sm text-zinc-500">{t("orders.statusActive")}</p>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-600">{myAssets.filter(a => a.status === "draft").length}</p>
            <p className="text-sm text-zinc-500">{t("orders.statusDraft")}</p>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              ${myAssets.reduce((sum, a) => sum + (a.price || 0), 0).toFixed(2)}
            </p>
            <p className="text-sm text-zinc-500">{t("orders.totalValue")}</p>
          </div>
        </div>

        {/* Products List */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {myAssets.length === 0 ? t("orders.noProducts") : t("common.noResults")}
            </p>
            {myAssets.length === 0 && (
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
              >
                <Plus size={18} />
                {t("orders.addFirstProduct")}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset._id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md dark:hover:shadow-none transition"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {asset.thumbnail_url ? (
                      <img
                        src={asset.thumbnail_url.startsWith("/") ? `${API_BASE}${asset.thumbnail_url}` : asset.thumbnail_url}
                        alt={asset.title}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Image size={24} className="text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white truncate text-lg">
                        {asset.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(asset.status)}`}>
                        {t(`orders.status${asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}`)}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-1">
                      {asset.short_description || asset.description || t("orders.noDescription")}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {asset.is_free ? t("orders.free") : `$${asset.price?.toFixed(2)}`}
                        {asset.discount_percentage > 0 && (
                          <span className="ml-1 text-xs text-green-600 font-normal">-{asset.discount_percentage}%</span>
                        )}
                      </span>
                      {asset.category?.name && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400">
                          {asset.category.name}
                        </span>
                      )}
                      <span className="text-zinc-400 text-xs">
                        {asset.downloads_count || 0} {t("orders.downloads")} · {asset.views_count || 0} {t("orders.views")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                      title={t("common.edit")}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset._id)}
                      className="p-2 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
