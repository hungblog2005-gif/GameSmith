import { useState, useContext } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Trash2, ShoppingCart, Check, Loader2, X } from "lucide-react"
import { CartContext } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Cart() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cartItems, removeItem, clearCart } = useContext(CartContext)
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'pending', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState("")

  const toggleSelectItem = (index) => {
    const indexStr = index.toString()
    if (selectedItems.includes(indexStr)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== indexStr))
    } else {
      setSelectedItems([...selectedItems, indexStr])
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map((_, index) => index.toString()))
    }
  }

  const handleRemoveItem = (index) => {
    removeItem(cartItems[index].id)
    setSelectedItems(selectedItems.filter(itemId => itemId !== index.toString()))
  }

  const applyVoucher = () => {
    if (voucherCode.trim()) {
      setAppliedVoucher({ code: voucherCode, discount: 10 })
    }
  }

  const calculateSubtotal = () => {
    return cartItems
      .filter((_, index) => selectedItems.includes(index.toString()))
      .reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const subtotal = calculateSubtotal()
  const discountAmount = appliedVoucher ? (subtotal * appliedVoucher.discount) / 100 : 0
  const total = subtotal - discountAmount

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login")
      return
    }

    if (selectedItems.length === 0) {
      setErrorMessage(t("cart.selectItems") || "Please select items")
      return
    }

    setShowPaymentModal(true)
  }

  const processPayment = async () => {
    if (!user) {
      setErrorMessage(t("payment.loginRequired"))
      return
    }

    const token = user.token || localStorage.getItem("authToken")
    if (!token) {
      setErrorMessage(t("payment.invalidToken"))
      return
    }

    setIsProcessing(true)
    setErrorMessage("")
    setPaymentStatus("pending")

    try {
      // Get selected cart items
      const itemsToOrder = cartItems.filter((_, index) => selectedItems.includes(index.toString()))

      // Step 1: Create order with multiple items
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          items: itemsToOrder.map(item => ({
            assetId: item.id,
            price: item.price,
            quantity: item.quantity,
          })),
          totalPrice: total,
        }),
      })

      if (!orderRes.ok) {
        throw new Error(t("payment.createOrderFailed"))
      }

      const order = await orderRes.json()

      // Step 2: Create payment
      const paymentRes = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          userId: user._id || user.id,
          amount: total,
          method: paymentMethod,
        }),
      })

      if (!paymentRes.ok) {
        const error = await paymentRes.json()
        throw new Error(error.message || t("payment.createPaymentFailed"))
      }

      setPaymentStatus("success")
      
      // Clear cart after successful payment
      setTimeout(() => {
        clearCart()
        setShowPaymentModal(false)
        setPaymentStatus(null)
        navigate("/downloads")
      }, 2000)
    } catch (error) {
      console.error("Payment error:", error)
      setErrorMessage(error.message || t("payment.paymentError"))
      setPaymentStatus("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const closePaymentModal = () => {
    if (!isProcessing && paymentStatus !== "pending") {
      setShowPaymentModal(false)
      setPaymentStatus(null)
      setErrorMessage("")
      setPaymentMethod("card")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("cart.loginRequired") || "Vui lòng đăng nhập để xem giỏ hàng"}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
          >
            {t("navbar.login")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("cart.myCart")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {cartItems.length} {t("cart.itemsInCart")}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("cart.emptyCart")}
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
            >
              {t("cart.continueShopping")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className={`flex items-center justify-center w-6 h-6 rounded border-2 transition ${
                    selectedItems.length === cartItems.length && cartItems.length > 0
                      ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  {selectedItems.length === cartItems.length && cartItems.length > 0 && (
                    <Check size={16} className="text-white dark:text-zinc-900" />
                  )}
                </button>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {selectedItems.length === cartItems.length && cartItems.length > 0
                    ? t("cart.deselectAll") || "Deselect all"
                    : t("cart.selectAll") || "Select all"}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  ({selectedItems.length}/{cartItems.length})
                </span>
              </div>

              {/* Items */}
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-2xl p-6 transition ${
                    selectedItems.includes(index.toString())
                      ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelectItem(index)}
                      className={`flex items-center justify-center w-6 h-6 rounded border-2 flex-shrink-0 transition mt-1 ${
                        selectedItems.includes(index.toString())
                          ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      {selectedItems.includes(index.toString()) && (
                        <Check size={14} className="text-white dark:text-zinc-900" />
                      )}
                    </button>

                    {/* Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/product/${item.id}`)}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-zinc-900 dark:text-white mb-1 cursor-pointer hover:underline truncate"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.name}
                      </h3>

                      {/* License & Format info */}
                      {item.options && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <span
                              key={key}
                              className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-lg font-semibold text-zinc-900 dark:text-white mt-2">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex-shrink-0 h-fit"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sticky top-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-6">
                  {t("common.total")}
                </h3>

                {/* Voucher */}
                <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("cart.applyVoucher")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t("cart.voucherCode")}
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                    />
                    <button
                      onClick={applyVoucher}
                      className="px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
                    >
                      OK
                    </button>
                  </div>
                  {appliedVoucher && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      ✓ {t("cart.voucherApplied") || "Voucher applied"} (-{appliedVoucher.discount}%)
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {t("cart.subtotal")} ({selectedItems.length} {t("cart.itemsInCart")})
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">{t("cart.discount")}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -${discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-white">{t("common.total")}</span>
                    <span className="font-bold text-lg text-zinc-900 dark:text-white">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("cart.checkout")} {selectedItems.length > 0 && `(${selectedItems.length})`}
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                >
                  {t("cart.continueShopping")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${showPaymentModal ? "visible" : "invisible"}`}>
            {/* Backdrop */}
            <div
              className={`absolute inset-0 bg-black transition-opacity ${showPaymentModal ? "opacity-50" : "opacity-0"}`}
              onClick={closePaymentModal}
            />

            {/* Modal */}
            <div
              className={`relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full mx-4 transition-all transform ${
                showPaymentModal ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("payment.title")}</h2>
                {!isProcessing && <button onClick={closePaymentModal} className="text-zinc-400 hover:text-zinc-600">
                  <X size={24} />
                </button>}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Success State */}
                {paymentStatus === "success" && (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                        {t("payment.paymentSuccess")}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        {t("payment.successMessage")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {paymentStatus === "error" && (
                  <div className="text-center space-y-4">
                    <div className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</div>
                    <button
                      onClick={() => {
                        setPaymentStatus(null)
                        setErrorMessage("")
                      }}
                      className="w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-2 rounded-lg font-medium transition"
                    >
                      {t("payment.tryAgain")}
                    </button>
                  </div>
                )}

                {/* Pending/Default State */}
                {paymentStatus !== "success" && paymentStatus !== "error" && (
                  <>
                    {/* Order Summary */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">
                        {t("payment.orderSummary")}
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {cartItems
                          .map((item, index) => ({ item, index }))
                          .filter(({ index }) => selectedItems.includes(index.toString()))
                          .map(({ item, index }) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">
                                {item.name} x{item.quantity}
                              </span>
                              <span className="font-medium text-zinc-900 dark:text-white">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </div>

                      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">{t("payment.price")}:</span>
                          <span className="font-medium text-zinc-900 dark:text-white">${subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600 dark:text-green-400">{t("cart.discount")}:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              -${discountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-white">
                          <span>{t("payment.totalPrice")}:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {t("payment.paymentMethod")}
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: "card", name: t("payment.creditCard"), icon: "💳" },
                          { id: "paypal", name: "PayPal", icon: "🅿️" },
                          { id: "wallet", name: t("payment.wallet"), icon: "👛" },
                        ].map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                              paymentMethod === method.id
                                ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={paymentMethod === method.id}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              disabled={isProcessing}
                              className="w-4 h-4"
                            />
                            <span className="text-lg">{method.icon}</span>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {method.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                        {errorMessage}
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      onClick={processPayment}
                      disabled={isProcessing}
                      className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                        isProcessing
                          ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                          : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                      }`}
                    >
                      {isProcessing && <Loader2 size={18} className="animate-spin" />}
                      {isProcessing ? t("payment.processing") : t("payment.buyNow")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
