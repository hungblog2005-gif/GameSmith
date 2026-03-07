import { useState, useEffect, useMemo } from "react"
import { X, Sparkles, ChevronDown, ChevronRight, Search, Check, Loader2, Tag } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

/**
 * Fab-style tag selector with grouped vocabulary, AI zero-shot suggestions,
 * and free-text custom tags.
 *
 * Props:
 *   value        — string[]  (controlled, array of selected tag names)
 *   onChange     — (tags: string[]) => void
 *   thumbnailUrl — string | "" — used for AI suggest (CLIP image embedding)
 *   authHeaders  — object — passed to the suggest-tags request
 *   maxTags      — number (default 20)
 */
export default function TagSelector({
  value = [],
  onChange,
  thumbnailUrl = "",
  fileFormats = [],
  title = "",
  description = "",
  categoryName = "",
  authHeaders = {},
  maxTags = 20,
}) {
  const [vocabulary, setVocabulary] = useState(null)
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])   // [{tag, group, score}]
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [customInput, setCustomInput] = useState("")

  // Load vocabulary on mount
  useEffect(() => {
    fetch(`${API_BASE}/assets/tags`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setVocabulary(data)
        const expanded = {}
        data.groups.forEach(g => { expanded[g.id] = true })
        setExpandedGroups(expanded)
      })
      .catch(console.error)
  }, [])

  const handleAISuggest = async () => {
    const hasSignal = thumbnailUrl || fileFormats.length > 0 || title
    if (!hasSignal) return
    setLoadingSuggest(true)
    try {
      const body = {}
      if (thumbnailUrl)            body.thumbnail_url  = thumbnailUrl
      if (title)                   body.title          = title
      if (description)             body.description    = description
      if (categoryName)            body.category_name  = categoryName
      if (fileFormats.length > 0)  body.file_names     = fileFormats
      const res = await fetch(`${API_BASE}/assets/suggest-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        const suggested = data.suggested_tags || []
        setSuggestions(suggested)
        if (data.vocabulary) setVocabulary(data.vocabulary)
        setIsOpen(true)
        // Auto-apply all suggested tags up to maxTags
        if (suggested.length > 0) {
          const next = [...value]
          for (const s of suggested) {
            if (!next.includes(s.tag) && next.length < maxTags) next.push(s.tag)
          }
          onChange(next)
        }
      }
    } catch (err) {
      console.error("AI suggest failed:", err)
    } finally {
      setLoadingSuggest(false)
    }
  }

  const toggleTag = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag))
    } else if (value.length < maxTags) {
      onChange([...value, tag])
    }
  }

  const applySuggestions = () => {
    const next = [...value]
    for (const s of suggestions) {
      if (!next.includes(s.tag) && next.length < maxTags) next.push(s.tag)
    }
    onChange(next)
  }

  const addCustomTag = () => {
    const tag = customInput.trim()
    if (!tag || value.includes(tag) || value.length >= maxTags) return
    onChange([...value, tag])
    setCustomInput("")
  }

  const getSuggestionScore = (tag) => {
    const s = suggestions.find(s => s.tag === tag)
    return s ? s.score : null
  }

  const toggleGroup = (groupId) =>
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))

  // Filter vocabulary by search query
  const filteredVocabulary = useMemo(() => {
    if (!vocabulary) return null
    if (!search.trim()) return vocabulary
    const q = search.toLowerCase()
    return {
      groups: vocabulary.groups
        .map(g => ({ ...g, tags: g.tags.filter(t => t.tag.toLowerCase().includes(q)) }))
        .filter(g => g.tags.length > 0),
    }
  }, [vocabulary, search])

  return (
    <div className="space-y-2">

      {/* ── Selected tags chips ── */}
      <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl">
        {value.length === 0 ? (
          <span className="text-sm text-zinc-400 self-center pl-1">No tags selected</span>
        ) : (
          value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium rounded-full"
            >
              {tag}
              <button type="button" onClick={() => toggleTag(tag)} className="hover:opacity-70 transition ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>
      <p className="text-xs text-zinc-400">{value.length}/{maxTags} tags</p>

      {/* ── Toolbar: Browse button + AI Suggest button ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
        >
          <Tag size={14} />
          <span>Browse Tags</span>
          {isOpen
            ? <ChevronDown size={14} className="ml-auto text-zinc-400" />
            : <ChevronRight size={14} className="ml-auto text-zinc-400" />
          }
        </button>

        {(() => {
          const signals = [
            thumbnailUrl && "image",
            fileFormats.length > 0 && "file types",
            title && "metadata",
          ].filter(Boolean)
          const hasSignal = signals.length > 0
          return (
            <button
              type="button"
              onClick={handleAISuggest}
              disabled={loadingSuggest || !hasSignal}
              title={hasSignal ? `Analyzing: ${signals.join(" + ")}` : "Add a thumbnail, title or file format first"}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingSuggest
                ? <Loader2 size={14} className="animate-spin" />
                : <Sparkles size={14} />
              }
              AI Suggest
            </button>
          )
        })()}
      </div>

      {/* ── AI Suggestions strip ── */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1">
              <Sparkles size={12} />
              AI Suggested ({suggestions.length})
            </span>
            <button
              type="button"
              onClick={applySuggestions}
              className="text-xs px-2.5 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
            >
              Apply All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button
                key={s.tag}
                type="button"
                onClick={() => toggleTag(s.tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border transition ${
                  value.includes(s.tag)
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "bg-white dark:bg-zinc-800 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                }`}
              >
                {value.includes(s.tag) && <Check size={9} />}
                {s.tag}
                <span className="opacity-60 font-normal ml-0.5">{Math.round(s.score * 100)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Browse panel ── */}
      {isOpen && (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">

          {/* Search */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tags…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
              />
            </div>
          </div>

          {/* Tag groups */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredVocabulary
              ? filteredVocabulary.groups.map(group => (
                <div key={group.id}>
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
                  >
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {group.label}
                    </span>
                    {expandedGroups[group.id]
                      ? <ChevronDown size={13} className="text-zinc-400" />
                      : <ChevronRight size={13} className="text-zinc-400" />
                    }
                  </button>

                  {/* Tags */}
                  {expandedGroups[group.id] && (
                    <div className="px-4 py-3 flex flex-wrap gap-1.5 bg-white dark:bg-zinc-950">
                      {group.tags.map(({ tag }) => {
                        const isSelected = value.includes(tag)
                        const score = getSuggestionScore(tag)
                        const isDisabled = !isSelected && value.length >= maxTags
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            disabled={isDisabled}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition ${
                              isSelected
                                ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900"
                                : score !== null
                                  ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            }`}
                          >
                            {isSelected && <Check size={10} />}
                            {tag}
                            {score !== null && !isSelected && (
                              <span className="text-violet-500 font-normal ml-0.5">{Math.round(score * 100)}%</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
              : (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  Loading vocabulary…
                </div>
              )
            }
          </div>

          {/* Custom tag input */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTag() } }}
                placeholder="Add custom tag…"
                maxLength={50}
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customInput.trim() || value.length >= maxTags}
                className="px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
