import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { MessageSquare, Send, Search, Loader2, Plus, ArrowLeft, Edit2, Circle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../hooks/useSocket"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Messages() {
  const { t } = useTranslation()
  const { user, getAuthHeaders } = useAuth()

  const [conversations, setConversations] = useState([])
  const [selectedConvId, setSelectedConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const {
    sendMessage: wsSendMessage,
    markAsRead,
    joinConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
  } = useSocket(user)

  // Fetch conversations
  useEffect(() => {
    if (!user?.token) {
      setLoading(false)
      return
    }
    fetchConversations()
  }, [user?.token])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConvId || !user?.token) return
    fetchMessages(selectedConvId)
    joinConversation(selectedConvId)
    markAsRead(selectedConvId)
  }, [selectedConvId])

  const fetchMessages = async (convId) => {
    setMessagesLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/messages/conversations/${convId}/messages`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(data.reverse())
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setMessagesLoading(false)
    }
  }

  // Listen for new messages via WebSocket
  useEffect(() => {
    const cleanup = onNewMessage((msg) => {
      const msgConvId = msg.conversationId?._id?.toString() || msg.conversationId?.toString()
      if (msgConvId === selectedConvId) {
        setMessages((prev) => {
          // Xóa optimistic message trùng nội dung cùng người gửi, thay bằng bản thật từ server
          const mySenderId = (user?.id || user?._id)?.toString()
          const msgSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString()
          const filtered = prev.filter((m) => {
            if (!String(m._id).startsWith("temp-")) return true
            return !(msgSenderId === mySenderId && m.content === msg.content)
          })
          return [...filtered, msg]
        })
        markAsRead(selectedConvId)
      }
      setConversations((prev) =>
        prev.map((c) => {
          if ((c._id || c.id) === msgConvId) {
            return { ...c, lastMessage: msg, updatedAt: new Date().toISOString() }
          }
          return c
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      )
    })
    return cleanup
  }, [selectedConvId, onNewMessage, markAsRead, user])

  // Listen for typing events
  useEffect(() => {
    const cleanupStart = onTypingStart(({ conversationId, userId }) => {
      if (userId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }))
      }
    })
    const cleanupStop = onTypingStop(({ conversationId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev }
        delete next[conversationId]
        return next
      })
    })
    return () => { cleanupStart?.(); cleanupStop?.() }
  }, [onTypingStart, onTypingStop, user?.id])

  // Listen for read receipts
  useEffect(() => {
    const cleanup = onMessageRead(({ conversationId, userId }) => {
      if (conversationId === selectedConvId && userId !== user?.id) {
        setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })))
      }
    })
    return cleanup
  }, [selectedConvId, onMessageRead, user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Search users for new chat
  useEffect(() => {
    if (!newChatSearch || newChatSearch.length < 2 || !user?.token) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/messages/users/search?q=${encodeURIComponent(newChatSearch)}`,
          { headers: getAuthHeaders() }
        )
        if (res.ok) setSearchResults(await res.json())
      } catch (err) {
        console.error("Failed to search users:", err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [newChatSearch, user?.token])

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !selectedConvId) return
    const trimmed = messageText.trim()
    // Optimistic update: hiện tin nhắn ngay lập tức không cần đợi WS
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: { _id: user?.id || user?._id, username: user?.username, avatar_url: user?.avatar_url },
      content: trimmed,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: "text",
    }
    setMessages((prev) => [...prev, optimisticMsg])
    wsSendMessage(selectedConvId, trimmed)
    setMessageText("")
    stopTyping(selectedConvId)
  }, [messageText, selectedConvId, wsSendMessage, stopTyping, user])

  const handleTyping = useCallback(() => {
    if (!selectedConvId) return
    startTyping(selectedConvId)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => stopTyping(selectedConvId), 2000)
  }, [selectedConvId, startTyping, stopTyping])

  const handleStartConversation = async (participantId) => {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ participantId }),
      })
      if (res.ok) {
        const conv = await res.json()
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === conv._id)
          return exists ? prev : [conv, ...prev]
        })
        setSelectedConvId(conv._id)
        setShowNewChat(false)
        setNewChatSearch("")
      }
    } catch (err) {
      console.error("Failed to create conversation:", err)
    }
  }

  const getOtherParticipant = (conv) => {
    if (!conv?.participants) return {}
    return conv.participants.find((p) => {
      const pid = p._id || p
      return pid !== user?.id && pid !== user?._id
    }) || {}
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const other = getOtherParticipant(conv)
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const currentConversation = conversations.find((c) => c._id === selectedConvId)
  const otherUser = getOtherParticipant(currentConversation)
  const isTyping = typingUsers[selectedConvId]

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-indigo-500" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4 font-medium">{t("messages.loginRequired")}</p>
          <a href="/login" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
            {t("navbar.login")}
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-6 px-4">
      <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)]">
        {/* Chat Container */}
        <div className="flex h-full rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">

          {/* ── Sidebar ── */}
          <div className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${selectedConvId ? "hidden md:flex" : "flex"}`}>

            {/* Sidebar Header */}
            <div className="px-4 pt-5 pb-3 flex items-center justify-between">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {t("messages.myMessages")}
              </h1>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className={`p-2 rounded-xl transition ${showNewChat ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"}`}
                title={t("messages.newConversation")}
              >
                <Edit2 size={17} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("messages.searchConversations")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
              </div>
            </div>

            {/* New Chat Panel */}
            {showNewChat && (
              <div className="mx-4 mb-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                  {t("messages.newConversation")}
                </p>
                <input
                  type="text"
                  placeholder={t("messages.searchUsers")}
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-0.5 max-h-44 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => handleStartConversation(u._id)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-zinc-700 transition text-left"
                      >
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=6366f1&color=fff`}
                          alt={u.username}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
                {newChatSearch.length >= 2 && searchResults.length === 0 && (
                  <p className="mt-2 text-xs text-zinc-500 text-center">{t("messages.noUsersFound")}</p>
                )}
              </div>
            )}

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={20} className="text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("messages.noConversations")}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("messages.newConversation")}</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv)
                  const unread = conv.unread_count?.[user?.id] || 0
                  const lastMsg = conv.lastMessage || conv.last_message
                  const isActive = selectedConvId === conv._id
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConvId(conv._id)}
                      className={`w-full text-left px-3 py-3 mx-0 flex items-center gap-3 transition-all ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-900/25"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={other?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.username || "U")}&background=6366f1&color=fff`}
                          alt={other?.username}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        {isActive && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-zinc-900 rounded-full" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm truncate ${unread > 0 ? "font-bold text-zinc-900 dark:text-white" : "font-medium text-zinc-800 dark:text-zinc-200"}`}>
                            {other?.username || "Unknown"}
                          </span>
                          <span className="text-[11px] text-zinc-400 flex-shrink-0">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`text-xs truncate ${unread > 0 ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                            {lastMsg?.content || t("messages.noMessages")}
                          </p>
                          {unread > 0 && (
                            <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex-shrink-0 min-w-[18px] text-center">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Chat Panel ── */}
          {selectedConvId ? (
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950">

              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="md:hidden p-1.5 -ml-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <img
                    src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.username || "U")}&background=6366f1&color=fff`}
                    alt={otherUser?.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-zinc-900 rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-white truncate leading-tight">
                    {otherUser?.username || "Unknown"}
                  </p>
                  {isTyping ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-indigo-500">{t("messages.typing")}</span>
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-500 font-medium">Online</p>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <MessageSquare size={26} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">{t("messages.startMessage")}</p>
                      <p className="text-sm text-zinc-400 mt-0.5">Say hi to {otherUser?.username}!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString()
                    const isMine = senderId === (user?.id || user?._id)?.toString()
                    const prevMsg = messages[idx - 1]
                    const prevSenderId = prevMsg?.senderId?._id?.toString() || prevMsg?.senderId?.toString()
                    const sameAsPrev = prevSenderId === senderId
                    const isTemp = String(msg._id).startsWith("temp-")

                    return (
                      <div key={msg._id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-0.5" : "mt-3"}`}>
                        {/* Avatar for other user */}
                        {!isMine && (
                          <div className="flex-shrink-0 w-7">
                            {!sameAsPrev && (
                              <img
                                src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.username || "U")}&background=6366f1&color=fff`}
                                alt={otherUser?.username}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            )}
                          </div>
                        )}

                        <div className={`max-w-[65%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                            isMine
                              ? `bg-indigo-600 text-white rounded-2xl rounded-br-sm ${isTemp ? "opacity-70" : ""}`
                              : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl rounded-bl-sm border border-zinc-100 dark:border-zinc-700"
                          }`}>
                            {msg.content}
                          </div>

                          {/* Timestamp + read status */}
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "flex-row-reverse" : ""}`}>
                            <span className="text-[10px] text-zinc-400">{formatTime(msg.createdAt)}</span>
                            {isMine && !isTemp && (
                              <span className={`text-[11px] font-bold ${msg.is_read ? "text-indigo-400" : "text-zinc-300"}`}>
                                {msg.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing indicator bubble */}
                {isTyping && (
                  <div className="flex items-end gap-2 mt-3">
                    <img
                      src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.username || "U")}&background=6366f1&color=fff`}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="px-4 py-3 bg-white dark:bg-zinc-800 rounded-2xl rounded-bl-sm border border-zinc-100 dark:border-zinc-700 shadow-sm flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t("messages.typeMessage")}
                    value={messageText}
                    onChange={(e) => { setMessageText(e.target.value); handleTyping() }}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state — no conversation selected */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
              <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-inner">
                <MessageSquare size={34} className="text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-lg">{t("messages.startConversation")}</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{t("messages.selectConversation")}</p>
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
              >
                <Plus size={16} />
                {t("messages.newConversation")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(dateStr) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return "now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`
  return date.toLocaleDateString()
}
