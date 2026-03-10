import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { AuthProvider } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import { CartProvider } from "./context/CartContext"
import { UserDataProvider } from "./context/UserDataContext"
import { ThemeProvider } from "./context/ThemeContext"
import MainLayout from "./layouts/MainLayout"
import AdminLayout from "./layouts/AdminLayout"
import AdminRoute from "./components/admin/AdminRoute"
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
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminAssets from "./pages/admin/AdminAssets"
import AdminOrders from "./pages/admin/AdminOrders"
import AdminCategories from "./pages/admin/AdminCategories"

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
      <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <UserDataProvider>
            <CartProvider>
              <Routes>
                {/* Admin SPA — standalone layout, no Navbar/Footer */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="assets" element={<AdminAssets />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="categories" element={<AdminCategories />} />
                </Route>

                {/* Main app — uses MainLayout with Navbar/Footer */}
                <Route path="*" element={<MainLayout><AppRoutes /></MainLayout>} />
              </Routes>
            </CartProvider>
          </UserDataProvider>
        </AuthProvider>
      </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  )
}
