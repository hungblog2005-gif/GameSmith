import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import {
  Package, Plus, Edit3, Trash2, Upload, X, Eye, EyeOff,
  Loader2, Image, DollarSign, Search, Filter, FileVideo
} from "lucide-react"
import TagSelector from "../components/product/TagSelector"

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
  preview_images: [],
  tags: [],
  file_format: "",
  license_type: "personal",
  status: "published",
}

export default function MyProduct() {
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
  const [uploadingPreview, setUploadingPreview] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [existingFiles, setExistingFiles] = useState([])  // files from backend (editing)
  const [pendingFiles, setPendingFiles] = useState([])    // {file, tempId} awaiting upload (new asset)
  const [loadingFiles, setLoadingFiles] = useState(false)
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

  const handlePreviewImagesUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingPreview(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(file => {
        fd.append("files", file)
      })
      const res = await fetch(`${API_BASE}/assets/upload-preview-images`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      })
      if (res.ok) {
        const { urls } = await res.json()
        setForm(prev => ({ ...prev, preview_images: [...(prev.preview_images || []), ...urls] }))
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploadingPreview(false)
    }
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditingId(null)
    setShowForm(false)
    setPendingFiles([])
    setExistingFiles([])
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
      preview_images: asset.preview_images || [],
      tags: asset.tags || [],
      file_format: (asset.file_format || []).join(", "),
      license_type: asset.license_type || "personal",
      status: asset.status || "draft",
    })
    setEditingId(asset._id)
    setPendingFiles([])
    setExistingFiles([])
    setShowForm(true)
    // Load existing files from backend
    setLoadingFiles(true)
    fetch(`${API_BASE}/assets/${asset._id}/files`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(files => setExistingFiles(Array.isArray(files) ? files : []))
      .catch(console.error)
      .finally(() => setLoadingFiles(false))
  }

  const handleAddFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (editingId) {
      setUploadingFile(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${API_BASE}/assets/${editingId}/upload-file`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: fd,
        })
        if (res.ok) {
          const newFile = await res.json()
          setExistingFiles(prev => [...prev, newFile])
        } else {
          console.error('File upload failed:', await res.text())
        }
      } catch (err) {
        console.error('File upload error:', err)
      } finally {
        setUploadingFile(false)
      }
    } else {
      const tempId = Date.now().toString()
      setPendingFiles(prev => [...prev, { file, tempId }])
    }
  }

  const handleRemoveExistingFile = async (fileKey) => {
    if (!editingId) return
    try {
      await fetch(`${API_BASE}/assets/${editingId}/files/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      setExistingFiles(prev => prev.filter(f => f.fileKey !== fileKey))
    } catch (err) {
      console.error('Remove file error:', err)
    }
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
      creatorId: user._id || user.id,
      thumbnail_url: form.thumbnail_url,
      preview_images: form.preview_images || [],
      tags: form.tags,
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
          // Upload all pending files
          for (const { file } of pendingFiles) {
            const fd = new FormData()
            fd.append('file', file)
            await fetch(`${API_BASE}/assets/${saved._id}/upload-file`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: fd,
            }).catch(err => console.error('File upload error:', err))
          }
        }
        resetForm()
      } else {
        const error = await res.json()
        console.error("Submit error:", error)
        alert(`Error: ${error.message || 'Failed to save product'}`)
      }
    } catch (err) {
      console.error("Submit failed:", err)
      alert("Error: " + err.message)
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
      case "published": return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
      case "draft": return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
      case "pending": return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
      case "hidden": return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      case "archived": return "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
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

                {/* Preview Images/Videos */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    {t("orders.previewImages") || "Preview Images & Videos"}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {/* Preview Items */}
                    {form.preview_images && form.preview_images.map((media, idx) => {
                      const isVideo = media.match(/\.(mp4|webm|mov)$/i);
                      return (
                        <div key={idx} className="relative group">
                          <div className="aspect-square rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            {isVideo ? (
                              <video
                                src={media.startsWith("/") ? `${API_BASE}${media}` : media}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={media.startsWith("/") ? `${API_BASE}${media}` : media}
                                alt={`Preview ${idx}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              preview_images: prev.preview_images.filter((_, i) => i !== idx)
                            }))}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                          >
                            <X size={14} />
                          </button>
                          {/* Video Badge */}
                          {isVideo && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                              <FileVideo size={12} />
                              VIDEO
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Button */}
                    {(!form.preview_images || form.preview_images.length < 10) && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 group">
                        {uploadingPreview ? (
                          <Loader2 size={24} className="animate-spin text-zinc-400" />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Plus size={28} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
                            <span className="text-xs text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition">Add</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*" 
                          onChange={handlePreviewImagesUpload} 
                          disabled={uploadingPreview}
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    {t("orders.maxFiles") || "Max 10 files. Images: JPG, PNG, GIF, WebP. Videos: MP4, WebM, MOV"}
                  </p>
                </div>

                {/* Download Files */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {t('orders.assetFiles') || 'Included Files'}
                    <span className="ml-1 text-xs text-zinc-400 font-normal">(.zip, .blend, .unitypackage, …)</span>
                  </label>

                  {loadingFiles && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                      <Loader2 size={14} className="animate-spin" />
                      {t('orders.loadingFiles') || 'Loading files…'}
                    </div>
                  )}

                  {/* Existing files (editing) */}
                  {existingFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {existingFiles.map(f => (
                        <div key={f.fileKey} className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-zinc-700 text-white">
                            {f.format}
                          </span>
                          <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{f.filename}</span>
                          {f.fileSize && <span className="text-xs text-zinc-400">{f.fileSize}</span>}
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingFile(f.fileKey)}
                            className="p-1 text-red-500 hover:text-red-700 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending files (new asset) */}
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {pendingFiles.map(({ file, tempId }) => (
                        <div key={tempId} className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                          <Upload size={14} className="text-blue-500 flex-shrink-0" />
                          <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{file.name}</span>
                          <span className="text-xs text-blue-500">{t('orders.pendingUpload') || 'pending'}</span>
                          <button
                            type="button"
                            onClick={() => setPendingFiles(prev => prev.filter(pf => pf.tempId !== tempId))}
                            className="p-1 text-red-500 hover:text-red-700 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add file */}
                  <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition text-sm text-zinc-500 dark:text-zinc-400">
                    {uploadingFile
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Plus size={16} />
                    }
                    {uploadingFile
                      ? (t('orders.uploading') || 'Uploading…')
                      : (t('orders.addFile') || 'Add file')
                    }
                    <input type="file" onChange={handleAddFile} disabled={uploadingFile} className="hidden" />
                  </label>
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

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {t("orders.tags")}
                  </label>
                  <TagSelector
                    value={form.tags}
                    onChange={(tags) => handleChange("tags", tags)}
                    thumbnailUrl={form.thumbnail_url}
                    fileFormats={form.file_format
                      ? form.file_format.split(",").map(s => s.trim()).filter(Boolean)
                      : []}
                    title={form.title}
                    description={form.description}
                    categoryName={categories.find(c => c._id === form.categoryId)?.name || ""}
                    authHeaders={getAuthHeaders()}
                    maxTags={20}
                  />
                </div>

                {/* File Format */}
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
                      <option value="published">{t("orders.statusPublished")}</option>
                      <option value="hidden">{t("orders.statusHidden")}</option>
                      <option value="archived">{t("orders.statusArchived")}</option>
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
            {["all", "published", "draft", "hidden"].map(status => (
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
            <p className="text-2xl font-bold text-green-600">{myAssets.filter(a => a.status === "published").length}</p>
            <p className="text-sm text-zinc-500">{t("orders.statusPublished")}</p>
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
