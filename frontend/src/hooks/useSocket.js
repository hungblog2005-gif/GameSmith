import { useEffect, useRef, useCallback } from "react"
import { io } from "socket.io-client"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export function useSocket(user) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user?.token) return

    const socket = io(`${API_BASE}/chat`, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.token])

  const sendMessage = useCallback((conversationId, content) => {
    socketRef.current?.emit("message:send", { conversationId, content })
  }, [])

  const markAsRead = useCallback((conversationId) => {
    socketRef.current?.emit("message:read", { conversationId })
  }, [])

  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit("conversation:join", { conversationId })
  }, [])

  const startTyping = useCallback((conversationId) => {
    socketRef.current?.emit("typing:start", { conversationId })
  }, [])

  const stopTyping = useCallback((conversationId) => {
    socketRef.current?.emit("typing:stop", { conversationId })
  }, [])

  const onNewMessage = useCallback((callback) => {
    socketRef.current?.on("message:new", callback)
    return () => socketRef.current?.off("message:new", callback)
  }, [])

  const onMessageRead = useCallback((callback) => {
    socketRef.current?.on("message:read", callback)
    return () => socketRef.current?.off("message:read", callback)
  }, [])

  const onTypingStart = useCallback((callback) => {
    socketRef.current?.on("typing:start", callback)
    return () => socketRef.current?.off("typing:start", callback)
  }, [])

  const onTypingStop = useCallback((callback) => {
    socketRef.current?.on("typing:stop", callback)
    return () => socketRef.current?.off("typing:stop", callback)
  }, [])

  const onUserOnline = useCallback((callback) => {
    socketRef.current?.on("user:online", callback)
    return () => socketRef.current?.off("user:online", callback)
  }, [])

  const onUserOffline = useCallback((callback) => {
    socketRef.current?.on("user:offline", callback)
    return () => socketRef.current?.off("user:offline", callback)
  }, [])

  return {
    socket: socketRef,
    sendMessage,
    markAsRead,
    joinConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
  }
}
