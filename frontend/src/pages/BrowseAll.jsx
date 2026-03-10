import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams, useLocation } from "react-router-dom"
import {
  Camera, Loader2, ChevronRight, ChevronDown,
  SlidersHorizontal, X, LayoutGrid, Sparkles,
} from "lucide-react"
import AssetCard from "../components/product/AssetCard"
import SEOHead from "../components/SEOHead"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"
const PAGE_SIZE = 30

// ── helpers ────────────────────────────────────────────────────────────────

function formatCount(n) {
  if (!n) return null
  if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "K"
  return String(n)
}

// ── SidebarCatRow ──────────────────────────────────────────────────────────

function SidebarCatRow({ label, count, active, onClick, indent = 0, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between pr-4 py-1.5 text-sm transition
        ${indent === 2 ? "pl-10" : indent === 1 ? "pl-8" : "pl-4"}
        ${className}
        ${active
          ? "text-violet-600 dark:text-violet-400 font-semibold bg-violet-50 dark:bg-violet-900/20"
          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
        }`}
    >
      <span className="truncate text-left">{label}</span>
      {count != null && (
        <span className={`text-xs px-1.5 py-0.5 rounded ml-2 flex-shrink-0 ${
          active
            ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
        }`}>
          {formatCount(count)}
        </span>
      )}
    </button>
  )
}

// ── BrowseSidebar ──────────────────────────────────────────────────────────

function BrowseSidebar({
  categories, filterCategory, setFilterCategory,
  selectedTags, onToggleTag, vocabulary,
  categoryCounts, tagCounts, onClearAll, totalActive, onClose,
}) {
  const [expandedCats, setExpandedCats] = useState({})
  const [expandedGroups, setExpandedGroups] = useState({})

  const childrenOf = useMemo(() => {
    const map = {}
    categories.forEach(c => {
      if (!c.parentId) return
      const pid = typeof c.parentId === "object" ? (c.parentId._id || c.parentId.toString()) : c.parentId
      if (!map[pid]) map[pid] = []
      map[pid].push(c)
    })
    return map
  }, [categories])

  const rootCats = categories.filter(c => !c.parentId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">BROWSE</span>
        <div className="flex items-center gap-3">
          {totalActive > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-violet-500 hover:text-violet-600 transition font-medium"
            >
              Clear all ({totalActive})
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Categories section */}
        <div className="py-1">
          <div className="px-4 pt-3 pb-1.5">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Categories
            </h2>
          </div>

          <SidebarCatRow
            label="All Assets"
            count={categoryCounts._all}
            active={filterCategory === "all"}
            onClick={() => setFilterCategory("all")}
          />

          {rootCats.map(cat => {
            const children = childrenOf[cat._id] || []
            const isExpanded = !!expandedCats[cat._id]
            return (
              <div key={cat._id}>
                <div className="flex items-stretch">
                  {children.length > 0 ? (
                    <button
                      onClick={() => setExpandedCats(p => ({ ...p, [cat._id]: !p[cat._id] }))}
                      className="pl-2 pr-0.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition flex-shrink-0"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  ) : (
                    <div className="w-5 flex-shrink-0" />
                  )}
                  <SidebarCatRow
                    label={cat.name}
                    count={categoryCounts[cat._id]}
                    active={filterCategory === cat._id}
                    onClick={() => setFilterCategory(cat._id)}
                    className="flex-1 pl-2"
                  />
                </div>
                {isExpanded && children.map(child => (
                  <SidebarCatRow
                    key={child._id}
                    label={child.name}
                    count={categoryCounts[child._id]}
                    active={filterCategory === child._id}
                    onClick={() => setFilterCategory(child._id)}
                    indent={2}
                  />
                ))}
              </div>
            )
          })}
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

        {/* Tag filter groups */}
        {vocabulary?.groups.map(group => {
          const isExpanded = expandedGroups[group.id] !== false
          const selectedInGroup = selectedTags[group.id] || []
          return (
            <div key={group.id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
              <button
                onClick={() => setExpandedGroups(p => ({ ...p, [group.id]: !isExpanded }))}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  {group.label}
                  {selectedInGroup.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded text-xs normal-case font-medium">
                      {selectedInGroup.length}
                    </span>
                  )}
                </span>
                {isExpanded ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-0.5">
                  {group.tags.map(({ tag }) => {
                    const count = tagCounts[tag] || 0
                    const checked = selectedInGroup.includes(tag)
                    return (
                      <label
                        key={tag}
                        className="flex items-center justify-between gap-2 py-1 cursor-pointer group"
                        onClick={() => onToggleTag(group.id, tag)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition ${
                            checked
                              ? "bg-violet-600 border-violet-600"
                              : "border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-500"
                          }`}>
                            {checked && (
                              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm truncate transition ${
                            checked
                              ? "text-zinc-900 dark:text-white font-medium"
                              : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
                          }`}>
                            {tag}
                          </span>
                        </div>
                        {count > 0 && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-600 flex-shrink-0">{count}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {!vocabulary && (
          <div className="px-4 py-6 text-center">
            <Loader2 size={16} className="animate-spin text-zinc-400 mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── BrowseAll ──────────────────────────────────────────────────────────────

export default function BrowseAll() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { state } = useLocation()
  const initialCategory = searchParams.get("category") || "all"
  const searchQuery = searchParams.get("search") || ""

  const imageResults = state?.imageResults || []
  const imageCaption = state?.imageCaption || ""

  const [sortBy, setSortBy] = useState("newest")
  const [filterCategory, setFilterCategory] = useState(initialCategory)
  const [selectedTags, setSelectedTags] = useState({})

  // Sync category filter when URL search params change (e.g. new search from navbar)
  useEffect(() => {
    setFilterCategory(searchParams.get("category") || "all")
  }, [searchParams])
  const [categories, setCategories] = useState([])
  const [vocabulary, setVocabulary] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── Pagination state ────────────────────────────────────────────────────
  const [assets, setAssets] = useState([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [aiResults, setAiResults] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  // ── Fetch one page ────────────────────────────────────────────────────
  const fetchPage = useCallback(async (currentSkip, append = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ status: "published", limit: PAGE_SIZE, skip: currentSkip })
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`${API_BASE}/assets?${params.toString()}`)
      const json = await res.json()
      const incoming = Array.isArray(json) ? json : (json.data ?? [])
      setAssets(prev => append ? [...prev, ...incoming] : incoming)
      setTotal(json.total ?? incoming.length)
      setHasMore(json.hasMore ?? false)
      setSkip(currentSkip + incoming.length)
    } catch (err) {
      console.error("Failed to fetch assets:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery])

  // Reset + initial load whenever search query changes
  useEffect(() => {
    setAssets([])
    setSkip(0)
    setHasMore(false)
    fetchPage(0, false)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch categories + tag vocabulary once
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/categories`).then(r => r.json()),
      fetch(`${API_BASE}/assets/tags`).then(r => r.ok ? r.json() : null),
    ]).then(([catsData, vocab]) => {
      setCategories(Array.isArray(catsData) ? catsData : [])
      if (vocab) setVocabulary(vocab)
    }).catch(console.error)
  }, [])

  // AI semantic search
  useEffect(() => {
    if (!searchQuery) { setAiResults([]); return }
    setAiResults([])  // clear stale results immediately before new fetch
    setAiLoading(true)
    fetch(`${API_BASE}/recommendations/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
      .then(r => r.json())
      .then(data => setAiResults(Array.isArray(data) ? data : []))
      .catch(() => setAiResults([]))
      .finally(() => setAiLoading(false))
  }, [searchQuery])

  // ── Load more ─────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchPage(skip, true)
  }, [loadingMore, hasMore, skip, fetchPage])

  const sentinelRef = useRef(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handleLoadMore() },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleLoadMore])

  // ── Computed ─────────────────────────────────────────────────

  const categoryCounts = useMemo(() => {
    const counts = { _all: total }
    assets.forEach(a => {
      const id = a.category?._id
      if (id) counts[id] = (counts[id] || 0) + 1
    })
    return counts
  }, [assets, total])

  const tagCounts = useMemo(() => {
    const counts = {}
    assets.forEach(a => {
      ;(a.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1 })
    })
    return counts
  }, [assets])

  const filteredProducts = useMemo(() => {
    return assets.filter(asset => {
      if (filterCategory !== "all" && asset.category?._id !== filterCategory) return false
      for (const [, tags] of Object.entries(selectedTags)) {
        if (!tags.length) continue
        if (!tags.some(t => (asset.tags || []).includes(t))) return false
      }
      return true
    })
  }, [assets, filterCategory, selectedTags])

  const filteredImageResults = useMemo(() => {
    if (!imageResults.length) return []
    return imageResults.filter(asset => {
      if (filterCategory !== "all" && asset.category?._id !== filterCategory) return false
      for (const [, tags] of Object.entries(selectedTags)) {
        if (!tags.length) continue
        if (!tags.some(t => (asset.tags || []).includes(t))) return false
      }
      return true
    })
  }, [imageResults, filterCategory, selectedTags])

  const filteredAiResults = useMemo(() => {
    if (!aiResults.length) return []
    return aiResults.filter(asset => {
      if (filterCategory !== "all" && asset.category?._id !== filterCategory) return false
      for (const [, tags] of Object.entries(selectedTags)) {
        if (!tags.length) continue
        if (!tags.some(t => (asset.tags || []).includes(t))) return false
      }
      return true
    })
  }, [aiResults, filterCategory, selectedTags])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case "price-low":  return a.price - b.price
        case "price-high": return b.price - a.price
        case "popular":    return (b.stats?.downloadCount || 0) - (a.stats?.downloadCount || 0)
        default:           return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })
  }, [filteredProducts, sortBy])

  const activeTagChips = useMemo(() => {
    if (!vocabulary) return []
    const chips = []
    for (const group of vocabulary.groups) {
      ;(selectedTags[group.id] || []).forEach(tag =>
        chips.push({ groupId: group.id, groupLabel: group.label, tag })
      )
    }
    return chips
  }, [selectedTags, vocabulary])

  const totalActiveFilters = Object.values(selectedTags).flat().length

  const toggleTagFilter = (groupId, tag) => {
    setSelectedTags(prev => {
      const cur = prev[groupId] || []
      const next = cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]
      return { ...prev, [groupId]: next }
    })
  }

  const clearAllFilters = () => {
    setSelectedTags({})
    setFilterCategory("all")
  }

  // ── Dynamic SEO ───────────────────────────────────────────────────────
  const activeCategory = filterCategory !== "all"
    ? categories.find(c => c._id === filterCategory)
    : null

  const seoTitle = searchQuery
    ? `Search: "${searchQuery}" – Game Assets`
    : activeCategory
      ? `${activeCategory.name} Game Assets`
      : "Browse All Game Assets"

  const seoDescription = searchQuery
    ? `Browse "${searchQuery}" game assets on GameSmith. Find high-quality 3D models, textures, audio, VFX, and more.`
    : activeCategory
      ? `Download premium ${activeCategory.name} game assets on GameSmith. High-quality files for game developers.`
      : "Browse and download premium game assets on GameSmith. Thousands of 3D models, textures, audio, UI kits, VFX, and more."

  const seoCanonical = searchQuery
    ? `/browse-all?search=${encodeURIComponent(searchQuery)}`
    : activeCategory
      ? `/browse-all?category=${activeCategory._id}`
      : "/browse-all"

  const sidebarProps = {
    categories, filterCategory, setFilterCategory,
    selectedTags, onToggleTag: toggleTagFilter,
    vocabulary, categoryCounts, tagCounts,
    onClearAll: clearAllFilters, totalActive: totalActiveFilters,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
      />

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 sticky top-0 self-start h-screen">
        <BrowseSidebar {...sidebarProps} />
      </aside>

      {/* ── Mobile Sidebar overlay ───────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl">
            <BrowseSidebar {...sidebarProps} onClose={() => setMobileSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Mobile Filters button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <SlidersHorizontal size={15} />
              Filters
              {totalActiveFilters > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-violet-600 text-white rounded-full text-xs font-bold">
                  {totalActiveFilters}
                </span>
              )}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {searchQuery ? `"${searchQuery}"` : t("browseAll.allProducts")}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {total} result{total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-zinc-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            >
              <option value="newest">{t("browseAll.newest")}</option>
              <option value="popular">{t("browseAll.popular")}</option>
              <option value="price-low">{t("browseAll.priceLow")}</option>
              <option value="price-high">{t("browseAll.priceHigh")}</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeTagChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeTagChips.map(({ groupId, groupLabel, tag }) => (
              <span
                key={`${groupId}:${tag}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full border border-violet-200 dark:border-violet-800"
              >
                <span className="opacity-60">{groupLabel}:</span> {tag}
                <button
                  onClick={() =>
                    setSelectedTags(prev => ({
                      ...prev,
                      [groupId]: (prev[groupId] || []).filter(t => t !== tag),
                    }))
                  }
                  className="hover:opacity-70 transition"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Image Search Results */}
        {imageResults.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Camera size={17} className="text-blue-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Visual similarity results
              </h2>
              {imageCaption && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  {imageCaption}
                </span>
              )}
              {filterCategory !== "all" && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {filteredImageResults.length} / {imageResults.length}
                </span>
              )}
            </div>
            {filteredImageResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredImageResults.map(asset => <AssetCard key={asset._id} asset={asset} />)}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 py-2">No image results match this category.</p>
            )}
            <hr className="mt-8 border-zinc-200 dark:border-zinc-800" />
          </div>
        )}

        {/* AI Semantic Search Results */}
        {searchQuery && (aiLoading || aiResults.length > 0) && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={17} className="text-violet-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                AI search results
              </h2>
              {/* Query badge — mirrors image caption badge */}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                {searchQuery}
              </span>
              {aiLoading && <Loader2 size={14} className="animate-spin text-zinc-400" />}
              {!aiLoading && filterCategory !== "all" && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {filteredAiResults.length} / {aiResults.length}
                </span>
              )}
            </div>
            {filteredAiResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredAiResults.map(asset => <AssetCard key={asset._id} asset={asset} />)}
              </div>
            ) : (
              !aiLoading && <p className="text-sm text-zinc-400 py-2">No AI results match this category.</p>
            )}
          </div>
        )}

        {/* Main Products Grid — hidden while AI search has results for current category */}
        {(!searchQuery || (!aiLoading && aiResults.length === 0) || (!aiLoading && filteredAiResults.length === 0 && filterCategory !== "all")) && (
          sortedProducts.length > 0 ? (
            <>
              {searchQuery && <hr className="mb-8 border-zinc-200 dark:border-zinc-800" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {sortedProducts.map(asset => <AssetCard key={asset._id} asset={asset} />)}
              </div>

              {/* Sentinel – IntersectionObserver triggers load + manual fallback button */}
              <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-3">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-zinc-400 text-sm py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading more…
                  </div>
                )}
                {!loadingMore && hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                  >
                    Load more ({total - skip} remaining)
                  </button>
                )}
                {!hasMore && assets.length > 0 && (
                  <p className="text-xs text-zinc-400 py-4">All {total} results loaded</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                {searchQuery ? <Sparkles size={28} className="text-zinc-400" /> : <LayoutGrid size={28} className="text-zinc-400" />}
              </div>
              {searchQuery ? (
                <>
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-2">No results found for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-sm text-zinc-400 mb-4">Try a different keyword or browse all assets</p>
                </>
              ) : (
                <>
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-2">No assets found</p>
                  <p className="text-sm text-zinc-400 mb-4">Try adjusting your filters</p>
                </>
              )}
              {totalActiveFilters > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 transition"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
