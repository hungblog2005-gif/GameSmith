import { useContext, useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { CartContext } from "../../context/CartContext"
import { Camera, Loader2, Menu, Package, Search, ShoppingCart, Sparkles } from "lucide-react"
import ThemeToggle from "../ui/ThemeToggle"
import UserMenu from "./UserMenu"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { cartCount } = useContext(CartContext)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [imageSuggestions, setImageSuggestions] = useState([])
  const [imageCaption, setImageCaption] = useState("")
  const [imageLoading, setImageLoading] = useState(false)
  const searchRef = useRef(null)
  const imageInputRef = useRef(null)

  // Debounced AI suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/recommendations/search?q=${encodeURIComponent(searchQuery)}&limit=5`
        )
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : [])
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/browse-all?search=${encodeURIComponent(q)}`)
      setSearchQuery("")
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setImageSuggestions([])
    setImageCaption("")
    setImageLoading(true)
    setShowSuggestions(true)

    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 512
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL("image/jpeg", 0.75).split(",")[1]
      try {
        const res = await fetch(`${API_BASE}/recommendations/image-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64 }),
        })
        const data = await res.json()
        const imageResults = Array.isArray(data.results) ? data.results : []
        // Navigate directly to BrowseAll with all results in location.state
        navigate("/browse-all", {
          state: { imageResults, imageCaption: data.caption || "" },
        })
        setShowSuggestions(false)
      } catch {
        setImageSuggestions([])
      } finally {
        setImageLoading(false)
      }
    }
    img.src = objectUrl
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition"
          >
            <Menu size={24} className="text-zinc-700 dark:text-zinc-300" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="font-semibold text-xl tracking-tight hover:opacity-80 transition text-zinc-900 dark:text-white"
          >
            {t("navbar.gameSmith")}
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-3 hidden sm:flex" ref={searchRef}>
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search assets..."
              className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />

            {/* Camera button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-blue-500 transition"
              title="Tìm kiếm bằng hình ảnh"
            >
              {imageLoading
                ? <Loader2 size={14} className="animate-spin text-blue-500" />
                : <Camera size={14} />}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && (imageLoading || imageSuggestions.length > 0 || suggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">

                {/* Image search results */}
                {(imageLoading || imageSuggestions.length > 0) && (
                  <>
                    <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <Camera size={11} className="text-blue-500" />
                      <span className="text-xs text-zinc-400">
                        {imageLoading ? "Đang nhận diện hình ảnh…" : `AI thấy: "${imageCaption}"`}
                      </span>
                    </div>
                    {imageLoading ? (
                      <div className="px-3 py-3 flex items-center gap-2 text-zinc-400 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Đang phân tích…</span>
                      </div>
                    ) : (
                      imageSuggestions.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onMouseDown={() => {
                            navigate(`/product/${s._id}`)
                            setImageSuggestions([])
                            setImageCaption("")
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                        >
                          <Camera size={12} className="text-blue-400 shrink-0" />
                          <span className="truncate">{s.title}</span>
                        </button>
                      ))
                    )}
                  </>
                )}

                {/* Text AI suggestions */}
                {!imageLoading && imageSuggestions.length === 0 && suggestions.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <Sparkles size={11} className="text-violet-500" />
                      <span className="text-xs text-zinc-400">AI suggestions</span>
                    </div>
                    {suggestions.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onMouseDown={() => {
                          navigate(`/product/${s._id}`)
                          setSearchQuery("")
                          setSuggestions([])
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                      >
                        <Search size={12} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </button>
                    ))}
                  </>
                )}

              </div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/my-product")}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Package size={20} />
            <span>{t("navbar.orders")}</span>
          </button>
          <button
            onClick={() => navigate("/cart")}
            className="relative flex items-center justify-center p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </button>
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
