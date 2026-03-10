import { useState, useContext } from 'react'
import { X, Loader2, CheckCircle2, Download, Heart, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { UserDataContext } from '../../context/UserDataContext'
import { useTranslation } from 'react-i18next'
import MomoPayment from './MomoPayment'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * PaymentModal Component
 * - Free assets: claim immediately, no payment required
 * - Paid assets: supports MoMo Personal QR payment method
 */
export default function PaymentModal({
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
  product = null,
  selectedLicense = 'personal',
  discountedPrice = 0,
}) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { wishlistItems = [], toggleWishlist } = useContext(UserDataContext) || {}
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [wishlistJustAdded, setWishlistJustAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  const isFree = discountedPrice === 0

  const getImageUrl = (url) => {
    if (!url) return null
    return url.startsWith('/') ? `${API_BASE}${url}` : url
  }

  if (!isOpen || !product) return null

  const handleClose = () => {
    if (!isLoading) {
      setPaymentId(null)
      setErrorMessage('')
      setSucceeded(false)
      onClose()
    }
  }

  const handleClaimFree = async () => {
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

    try {
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user._id || user.id,
          items: [{ assetId: product._id, price: 0 }],
          totalAmount: 0,
        }),
      })
      if (!orderRes.ok) {
        const err = await orderRes.json()
        throw new Error(err.message || t('payment.createOrderFailed'))
      }
      const order = await orderRes.json()

      const paymentRes = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: order._id,
          userId: user._id || user.id,
          amount: 0,
          method: 'free',
        }),
      })
      if (!paymentRes.ok) {
        const err = await paymentRes.json()
        throw new Error(err.message || t('payment.createPaymentFailed'))
      }
      setSucceeded(true)
      onSuccess()
      setTimeout(handleClose, 2000)
    } catch (error) {
      setErrorMessage(error.message || t('payment.paymentError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitiatePayment = async () => {
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

    try {
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          items: [{ assetId: product._id, price: discountedPrice }],
          totalAmount: discountedPrice,
        }),
      })
      if (!orderRes.ok) {
        const orderErr = await orderRes.json()
        throw new Error(orderErr.message || t('payment.createOrderFailed'))
      }
      const order = await orderRes.json()

      const paymentRes = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          userId: user._id || user.id,
          amount: discountedPrice,
          method: 'momo_personal',
        }),
      })
      if (!paymentRes.ok) {
        const err = await paymentRes.json()
        throw new Error(err.message || t('payment.createPaymentFailed'))
      }
      const payment = await paymentRes.json()
      setPaymentId(payment.data.paymentId)
    } catch (error) {
      setErrorMessage(error.message || t('payment.paymentError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {paymentId ? 'Thanh toán qua MoMo' : isFree ? 'Nhận miễn phí' : t('payment.title')}
            </h2>
          </div>
          {!isLoading && (
            <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              <X size={22} />
            </button>
          )}
        </div>

        <div className="p-5">
          {paymentId ? (
            <MomoPayment
              paymentId={paymentId}
              onSuccess={() => {
                setSucceeded(true)
                setTimeout(handleClose, 2500)
              }}
              onExpire={() => {
                setPaymentId(null)
                setErrorMessage('Đơn hàng đã hết thời gian. Vui lòng thử lại.')
              }}
            />
          ) : succeeded ? (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 size={48} className="text-green-500" />
              <p className="font-semibold text-zinc-900 dark:text-white text-lg">
                {isFree ? 'Asset đã được thêm vào thư viện!' : 'Thanh toán thành công!'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Bạn có thể tải về trong mục Downloads</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Product info */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 flex gap-3">
                <img
                  src={
                    getImageUrl(product.thumbnail_url) ||
                    getImageUrl(product.preview_images?.[0]) ||
                    'https://placehold.co/64x64'
                  }
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-sm">
                  <h4 className="font-semibold text-zinc-900 dark:text-white truncate">{product.title}</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                    {t('payment.license')}:{' '}
                    {selectedLicense === 'personal'
                      ? t('productDetail.licensePersonal')
                      : selectedLicense === 'commercial'
                      ? t('productDetail.licenseCommercial')
                      : t('productDetail.licenseExtended')}
                  </p>
                  <p className="font-bold mt-2">
                    {isFree
                      ? <span className="text-green-600 dark:text-green-400">Miễn phí</span>
                      : <span className="text-zinc-900 dark:text-white">${discountedPrice.toFixed(2)}</span>}
                  </p>
                </div>
              </div>

              {/* Payment method */}
              {isFree ? (
                <div className="border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">Asset miễn phí</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Nhận ngay · Không cần thanh toán</p>
                  </div>
                </div>
              ) : (
                <div className="border border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">MoMo</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Quét QR · Tự điền số tiền</p>
                  </div>
                  <div className="ml-auto w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                  {errorMessage}
                </div>
              )}

              {isFree ? (
                <button
                  onClick={handleClaimFree}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isLoading ? 'Đang xử lý...' : 'Nhận miễn phí'}
                </button>
              ) : (
                <button
                  onClick={handleInitiatePayment}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white transition disabled:opacity-60"
                >
                  {isLoading && <Loader2 size={18} className="animate-spin" />}
                  {isLoading ? t('payment.processing') : 'Tiếp tục thanh toán MoMo'}
                </button>
              )}

              {/* Wishlist button */}
              {(() => {
                const inWishlist = wishlistItems.some(item => item.id === product._id)
                return (
                  <button
                    onClick={async () => {
                      if (!user) { setErrorMessage(t('payment.loginRequired')); return }
                      setIsWishlistLoading(true)
                      try {
                        await toggleWishlist(product._id)
                        if (!inWishlist) {
                          setWishlistJustAdded(true)
                          setTimeout(() => setWishlistJustAdded(false), 1800)
                        }
                      } finally { setIsWishlistLoading(false) }
                    }}
                    disabled={isWishlistLoading}
                    className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 border transition-all duration-200 active:scale-95 disabled:opacity-60 ${
                      wishlistJustAdded
                        ? 'border-green-400 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 scale-[0.98]'
                        : inWishlist
                        ? 'border-red-400 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 dark:hover:border-red-500 dark:hover:text-red-400'
                    }`}
                  >
                    {isWishlistLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : wishlistJustAdded ? (
                      <CheckCheck size={16} />
                    ) : (
                      <Heart size={16} className={inWishlist ? 'fill-current' : ''} />
                    )}
                    {isWishlistLoading
                      ? 'Đang lưu...'
                      : wishlistJustAdded
                      ? 'Đã thêm vào Wishlist!'
                      : inWishlist
                      ? 'Đã lưu vào Wishlist'
                      : 'Thêm vào Wishlist'}
                  </button>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

