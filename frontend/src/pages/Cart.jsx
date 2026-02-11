import { useState, useContext } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Trash2, ShoppingCart, Check } from "lucide-react"
import { CartContext } from "../context/CartContext"

export default function Cart() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { cartItems, removeItem, clearCart } = useContext(CartContext)
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])

  const toggleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map(item => item.id))
    }
  }

  const handleRemoveItem = (id) => {
    removeItem(id)
    setSelectedItems(selectedItems.filter(itemId => itemId !== id))
  }

  const applyVoucher = () => {
    if (voucherCode.trim()) {
      setAppliedVoucher({ code: voucherCode, discount: 10 })
    }
  }

  const calculateSubtotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const subtotal = calculateSubtotal()
  const discountAmount = appliedVoucher ? (subtotal * appliedVoucher.discount) / 100 : 0
  const total = subtotal - discountAmount

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
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-6 transition ${
                    selectedItems.includes(item.id)
                      ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelectItem(item.id)}
                      className={`flex items-center justify-center w-6 h-6 rounded border-2 flex-shrink-0 transition mt-1 ${
                        selectedItems.includes(item.id)
                          ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      {selectedItems.includes(item.id) && (
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
                      onClick={() => handleRemoveItem(item.id)}
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
      </div>
    </div>
  )
}
