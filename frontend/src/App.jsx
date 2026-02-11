import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import { CartProvider } from "./context/CartContext"
import { UserDataProvider } from "./context/UserDataContext"
import MainLayout from "./layouts/MainLayout"
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

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <UserDataProvider>
            <CartProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:productId" element={<ProductDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/my-product" element={<MyProduct />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/downloads" element={<Downloads />} />
                  <Route path="/browse-all" element={<BrowseAll />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/cart" element={<Cart />} />
                </Routes>
              </MainLayout>
            </CartProvider>
          </UserDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  )
}
