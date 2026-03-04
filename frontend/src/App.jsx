import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { AuthProvider } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import { CartProvider } from "./context/CartContext"
import { UserDataProvider } from "./context/UserDataContext"
import MainLayout from "./layouts/MainLayout"
import PageTransition from "./components/ui/PageTransition"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Settings from "./pages/Settings"
import ProductDetail from "./pages/ProductDetail"
import MyProduct from "./pages/MyProduct"
import Wishlist from "./pages/Wishlist"
import Downloads from "./pages/Downloads"
import BrowseAll from "./pages/BrowseAll"
import Categories from "./pages/Categories"
import Profile from "./pages/Profile"
import Messages from "./pages/Messages"
import Cart from "./pages/Cart"

function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/product/:productId" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/my-product" element={<PageTransition><MyProduct /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
        <Route path="/downloads" element={<PageTransition><Downloads /></PageTransition>} />
        <Route path="/browse-all" element={<PageTransition><BrowseAll /></PageTransition>} />
        <Route path="/categories" element={<PageTransition><Categories /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <UserDataProvider>
            <CartProvider>
              <MainLayout>
                <AppRoutes />
              </MainLayout>
            </CartProvider>
          </UserDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  )
}
