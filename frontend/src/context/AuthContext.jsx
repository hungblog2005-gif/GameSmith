import { createContext, useContext, useState, useEffect } from "react"
import i18n from "../i18n/i18n"

const AuthContext = createContext()

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== "string") return value
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  if (value.startsWith("/")) return `${API_BASE}${value}`
  return value
}

const normalizeUser = (user) => {
  if (!user) return null
  return {
    ...user,
    id: user.id || user._id,
    avatar_url: toAbsoluteUrl(user.avatar_url),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser")
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      // Strip token before persisting — token lives in React state only, never localStorage
      const { token: _t, ...userToStore } = user
      localStorage.setItem("currentUser", JSON.stringify(userToStore))
    } else {
      localStorage.removeItem("currentUser")
    }
  }, [user])

  const getAuthHeaders = () => {
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {}
  }

  // Fetch profile from profiles collection and merge into user state
  const fetchAndMergeProfile = async (currentUser) => {
    if (!currentUser?.username) return currentUser
    try {
      const res = await fetch(`${API_BASE}/profiles/username/${currentUser.username}`)
      if (!res.ok) return currentUser
      const profile = await res.json()
      if (!profile) return currentUser
      return normalizeUser({
        ...currentUser,
        first_name:   profile.firstName   ?? currentUser.first_name   ?? "",
        last_name:    profile.lastName    ?? currentUser.last_name    ?? "",
        phone_number: profile.phoneNumber ?? currentUser.phone_number ?? "",
        address:      profile.address     ?? currentUser.address      ?? "",
        city:         profile.city        ?? currentUser.city         ?? "",
        country:      profile.country     ?? currentUser.country      ?? "",
        postal_code:  profile.postalCode  ?? currentUser.postal_code  ?? "",
        date_of_birth: profile.dateOfBirth
          ? String(profile.dateOfBirth).split("T")[0]
          : (currentUser.date_of_birth ?? ""),
        gender:       profile.gender      ?? currentUser.gender       ?? "",
        avatar_url:   toAbsoluteUrl(profile.avatarUrl ?? currentUser.avatar_url),
      })
    } catch {
      return currentUser
    }
  }

  // On startup: silently refresh access token using the httpOnly rt cookie
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (!savedUser) return
    fetch(`${API_BASE}/users/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) { localStorage.removeItem("currentUser"); return }
        const data = await res.json()
        const merged = await fetchAndMergeProfile(normalizeUser(data))
        setUser(merged)
      })
      .catch(() => localStorage.removeItem("currentUser"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      if (!email || !password) {
        return { success: false, message: i18n.t("auth.fillInfo") }
      }
      
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let message = i18n.t("auth.invalidEmail")
        
        if (errorData.message) {
          message = Array.isArray(errorData.message) 
            ? errorData.message.join(", ") 
            : errorData.message
        }
        return { success: false, message }
      }

      const data = await response.json()
      const merged = await fetchAndMergeProfile(normalizeUser(data))
      setUser(merged)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name, email, password) => {
    setIsLoading(true)
    try {
      if (!email || !password || !name) {
        return { success: false, message: i18n.t("auth.fillInfo") }
      }
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: name, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let message = i18n.t("auth.fillInfo")
        
        if (response.status === 409) {
          message = i18n.t("auth.emailExists")
        } else if (errorData.message) {
          // Show backend validation error
          message = Array.isArray(errorData.message) 
            ? errorData.message.join(", ") 
            : errorData.message
        }
        return { success: false, message }
      }

      const data = await response.json()
      setUser(normalizeUser(data))
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    // Revoke refresh token server-side and clear httpOnly cookie
    fetch(`${API_BASE}/users/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {})
  }

  const updateAvatar = async (file) => {
    if (!user) {
      return { success: false, message: "Please log in first" }
    }

    if (!file || !file.type.startsWith("image/")) {
      return { success: false, message: "Please select an image file" }
    }

    if (file.size > 2 * 1024 * 1024) {
      return { success: false, message: "Image must be 2MB or smaller" }
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE}/users/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        return { success: false, message: "Upload failed" }
      }

      const data = await response.json()
      const normalized = normalizeUser(data)

      // Sync avatar_url to profiles collection
      await fetch(`${API_BASE}/profiles/username/${user.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: normalized.avatar_url }),
      })

      setUser(normalized)
      return { success: true, avatar: normalized.avatar_url }
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profile) => {
    if (!user) {
      return { success: false, message: "Please log in first" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/profiles/username/${user.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        return { success: false, message: "Update failed" }
      }

      const data = await response.json()
      setUser(normalizeUser({ ...user,
        first_name:    data.firstName    ?? "",
        last_name:     data.lastName     ?? "",
        phone_number:  data.phoneNumber  ?? "",
        address:       data.address      ?? "",
        city:          data.city         ?? "",
        country:       data.country      ?? "",
        postal_code:   data.postalCode   ?? "",
        date_of_birth: data.dateOfBirth ? String(data.dateOfBirth).split("T")[0] : "",
        gender:        data.gender       ?? "",
      }))
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, updateAvatar, updateProfile, getAuthHeaders, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
