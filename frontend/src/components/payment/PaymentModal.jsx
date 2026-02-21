import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * PaymentModal Component
 * Hiển thị UI thanh toán khi user click "Buy Now"
 */
export default function PaymentModal({
  isOpen = false,
  onClose = () => {},
  product = null,
  selectedLicense = 'personal',
  selectedFormat = null,
  discountedPrice = 0,
}) {
  const { user, getAuthHeaders } = useAuth()
  const { t } = useTranslation()
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'pending', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [paymentId, setPaymentId] = useState(null)

  const getImageUrl = (url) => {
    if (!url) return null
    return url.startsWith("/") ? `${API_BASE}${url}` : url
  }

  if (!isOpen || !product) return null

  const handleBuyNow = async () => {
    if (!user) {
      setErrorMessage(t('payment.loginRequired'))
      return
    }

    const token = user.token || localStorage.getItem('authToken')
    if (!token) {
      setErrorMessage(t('payment.invalidToken'))
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setPaymentStatus('pending')

    try {
      // Step 1: Create order
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          items: [
            {
              assetId: product._id,
              price: discountedPrice,
            },
          ],
          totalPrice: discountedPrice,
        }),
      })

      if (!orderRes.ok) {
        throw new Error(t('payment.createOrderFailed'))
      }

      const order = await orderRes.json()
      setOrderId(order._id)

      // Step 2: Create payment
      const paymentRes = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          userId: user._id,
          amount: discountedPrice,
          method: paymentMethod,
        }),
      })

      if (!paymentRes.ok) {
        const error = await paymentRes.json()
        throw new Error(error.message || t('payment.createPaymentFailed'))
      }

      const payment = await paymentRes.json()
      setPaymentId(payment.data.paymentId)

      // Step 3: Process payment based on method
      if (paymentMethod === 'card') {
        // For card payment, you would integrate with Stripe here
        // For now, we'll show a success message for demo
        setPaymentStatus('success')
      } else if (paymentMethod === 'wallet') {
        // Process wallet payment
        setPaymentStatus('success')
      } else {
        // Other payment methods
        setPaymentStatus('success')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setErrorMessage(error.message || t('payment.paymentError'))
      setPaymentStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (paymentStatus !== 'pending' && !isLoading) {
      setPaymentStatus(null)
      setErrorMessage('')
      setOrderId(null)
      setPaymentId(null)
      onClose()
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity ${isOpen ? 'opacity-50' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full mx-4 transition-all transform ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t('payment.title')}</h2>
          {!isLoading && <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success State */}
          {paymentStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {t('payment.paymentSuccess')}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  {t('payment.successMessage')}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition"
              >
                {t('payment.done')}
              </button>
            </div>
          )}

          {/* Error State */}
          {paymentStatus === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</div>
              <button
                onClick={() => {
                  setPaymentStatus(null)
                  setErrorMessage('')
                }}
                className="w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-2 rounded-lg font-medium transition"
              >
                {t('payment.tryAgain')}
              </button>
            </div>
          )}

          {/* Pending/Default State */}
          {paymentStatus !== 'success' && paymentStatus !== 'error' && (
            <>
              {/* Order Summary */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={getImageUrl(product.thumbnail_url) || getImageUrl(product.preview_images?.[0]) || 'https://placehold.co/60x60'}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 text-sm">
                    <h4 className="font-medium text-zinc-900 dark:text-white">{product.title}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                      {t('payment.license')}: {selectedLicense === 'personal' ? t('productDetail.licensePersonal') : selectedLicense === 'commercial' ? t('productDetail.licenseCommercial') : t('productDetail.licenseExtended')}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('payment.price')}:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">${discountedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-white">
                    <span>{t('payment.totalPrice')}:</span>
                    <span>${discountedPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {t('payment.paymentMethod')}
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'card', name: t('payment.creditCard'), icon: '💳' },
                    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
                    { id: 'wallet', name: t('payment.wallet'), icon: '👛' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        paymentMethod === method.id
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="text-lg">{method.icon}</span>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{method.name}</span>
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

              {/* Buy Button */}
              <button
                onClick={handleBuyNow}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  isLoading
                    ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                }`}
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {isLoading ? t('payment.processing') : t('payment.buyNow')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
