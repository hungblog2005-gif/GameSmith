import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MessageSquare, Send, Search } from "lucide-react"

export default function Messages() {
  const { t } = useTranslation()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [conversations] = useState([
    {
      id: 1,
      name: "GameSmith Support",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
      lastMessage: "We're here to help! How can we assist you?",
      timestamp: "2 hours ago",
      unread: 2,
      messages: [
        { id: 1, sender: "support", text: "Hello! Thank you for reaching out.", time: "10:30 AM" },
        { id: 2, sender: "support", text: "We're here to help! How can we assist you?", time: "10:35 AM" },
        { id: 3, sender: "user", text: "Hi! I have a question about my order", time: "11:00 AM" }
      ]
    },
    {
      id: 2,
      name: "John Developer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      lastMessage: "Thanks for the assets! They're perfect.",
      timestamp: "1 day ago",
      unread: 0,
      messages: [
        { id: 1, sender: "other", text: "Hi, thanks for the UI kit!", time: "Yesterday" },
        { id: 2, sender: "user", text: "You're welcome! Hope it helps with your project.", time: "Yesterday" }
      ]
    },
    {
      id: 3,
      name: "Design Team",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      lastMessage: "Let's discuss the new features.",
      timestamp: "3 days ago",
      unread: 0,
      messages: []
    }
  ])

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentConversation = conversations.find(c => c.id === selectedConversation)

  const handleSendMessage = () => {
    if (messageText.trim() && currentConversation) {
      // Message sending logic would go here
      setMessageText("")
    }
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
          <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-zinc-600 dark:text-zinc-400">
                  {t("common.noResults")}
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition ${
                        selectedConversation === conv.id
                          ? "bg-zinc-100 dark:bg-zinc-900"
                          : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={conv.avatar}
                          alt={conv.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                              {conv.name}
                            </h3>
                            {conv.unread > 0 && (
                              <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            {conv.timestamp}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message Panel */}
          {selectedConversation ? (
            <div className="hidden md:flex flex-1 flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <img
                  src={currentConversation.avatar}
                  alt={currentConversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {currentConversation.name}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConversation.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                    {t("messages.noMessages")}
                  </div>
                ) : (
                  currentConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender === "user"
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("messages.typeMessage")}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
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
                <p>{t("messages.startConversation")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
