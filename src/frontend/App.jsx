import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import MainLayout from "./layouts/MainLayout"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Settings from "./pages/Settings"

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  )
}
