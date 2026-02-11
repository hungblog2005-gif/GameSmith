import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { MessageSquare, Send, Search, Loader2, Plus, ArrowLeft } from "lucide-react"
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
      if (msg.conversation === selectedConvId || msg.conversation?._id === selectedConvId) {
        setMessages((prev) => [...prev, msg])
        markAsRead(selectedConvId)
      }
      setConversations((prev) =>
        prev.map((c) => {
          const cid = c._id || c.id
          const msgConvId = msg.conversation?._id || msg.conversation
          if (cid === msgConvId) {
            return { ...c, last_message: msg, updatedAt: new Date().toISOString() }
          }
          return c
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      )
    })
    return cleanup
  }, [selectedConvId, onNewMessage, markAsRead])

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
    wsSendMessage(selectedConvId, messageText.trim())
    setMessageText("")
    stopTyping(selectedConvId)
  }, [messageText, selectedConvId, wsSendMessage, stopTyping])

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
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("messages.loginRequired")}</p>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("messages.myMessages")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
          </p>
        </div>

        {/* Container */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 flex h-[600px]">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${selectedConvId ? "hidden md:flex" : "flex"}`}>
            {/* Search + New Chat */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder={t("messages.searchConversations")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                />
              </div>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
              >
                <Plus size={16} />
                {t("messages.newConversation")}
              </button>
            </div>

            {/* New Chat Search */}
            {showNewChat && (
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <input
                  type="text"
                  placeholder={t("messages.searchUsers")}
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => handleStartConversation(u._id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
                      >
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random`}
                          alt={u.username}
                          className="w-8 h-8 rounded-full object-cover"
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

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-zinc-600 dark:text-zinc-400">
                  <MessageSquare size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                  <p className="text-sm">{t("messages.noConversations")}</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredConversations.map((conv) => {
                    const other = getOtherParticipant(conv)
                    const unread = conv.unread_count?.[user?.id] || 0
                    const lastMsg = conv.last_message
                    return (
                      <button
                        key={conv._id}
                        onClick={() => setSelectedConvId(conv._id)}
                        className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition ${
                          selectedConvId === conv._id ? "bg-zinc-100 dark:bg-zinc-900" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={other?.avatar_url || `https://ui-avatars.com/api/?name=${other?.username || "U"}&background=random`}
                            alt={other?.username}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                                {other?.username || "Unknown"}
                              </h3>
                              {unread > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                              {lastMsg?.content || t("messages.noMessages")}
                            </p>
                            {conv.updatedAt && (
                              <p className="text-xs text-zinc-500 mt-1">
                                {formatTime(conv.updatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Message Panel */}
          {selectedConvId ? (
            <div className={`flex-1 flex flex-col ${selectedConvId ? "flex" : "hidden md:flex"}`}>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="md:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                >
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUser?.username || "U"}&background=random`}
                  alt={otherUser?.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    {otherUser?.username || "Unknown"}
                  </h3>
                  {isTyping && (
                    <p className="text-xs text-blue-500">{t("messages.typing")}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                    <div className="text-center">
                      <MessageSquare size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                      <p className="text-sm">{t("messages.startMessage")}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = (msg.sender?._id || msg.sender) === user?.id
                    return (
                      <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[70%]">
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-br-md"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                            <p className="text-[11px] text-zinc-400">{formatTime(msg.createdAt)}</p>
                            {isMine && msg.is_read && (
                              <span className="text-[11px] text-blue-500">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("messages.typeMessage")}
                    value={messageText}
                    onChange={(e) => { setMessageText(e.target.value); handleTyping() }}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-zinc-600 dark:text-zinc-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                <p className="font-medium mb-1">{t("messages.startConversation")}</p>
                <p className="text-sm text-zinc-500">{t("messages.selectConversation")}</p>
              </div>
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
