import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

// Helper function để lấy danh sách users đã đăng ký
const getRegisteredUsers = () => {
  const users = localStorage.getItem("registeredUsers")
  return users ? JSON.parse(users) : []
}

// Helper function để lưu users
const saveRegisteredUsers = (users) => {
  localStorage.setItem("registeredUsers", JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser")
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user))
    } else {
      localStorage.removeItem("currentUser")
    }
  }, [user])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Kiểm tra trong danh sách users đã đăng ký
      const registeredUsers = getRegisteredUsers()
      const foundUser = registeredUsers.find(
        (u) => u.email === email && u.password === password
      )

      if (foundUser) {
        // Không lưu password khi login
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
        return { success: true }
      } else {
        return { success: false, message: "Email hoặc mật khẩu không chính xác" }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name, email, password) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (!email || !password || !name) {
        return { success: false, message: "Vui lòng điền đầy đủ thông tin" }
      }

      // Kiểm tra email đã tồn tại chưa
      const registeredUsers = getRegisteredUsers()
      const emailExists = registeredUsers.some((u) => u.email === email)

      if (emailExists) {
        return { success: false, message: "Email này đã được đăng ký" }
      }

      // Tạo user mới
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        password, // Lưu password (trong thực tế không nên làm vậy)
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(
          Math.random() * 70
        )}`,
      }

      // Lưu vào danh sách users
      registeredUsers.push(newUser)
      saveRegisteredUsers(registeredUsers)

      // Login ngay sau khi signup
      const { password: _, ...userWithoutPassword } = newUser
      setUser(userWithoutPassword)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
