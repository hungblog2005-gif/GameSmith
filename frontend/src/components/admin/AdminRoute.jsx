import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

/**
 * Protects /admin/* routes.
 * - Not logged in → redirect /login
 * - Logged in but not admin/moderator → redirect /
 */
export default function AdminRoute({ children }) {
  const { user, isAuthReady } = useAuth()

  if (!isAuthReady) return null

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== "admin" && user.role !== "moderator") {
    return <Navigate to="/" replace />
  }

  return children
}
