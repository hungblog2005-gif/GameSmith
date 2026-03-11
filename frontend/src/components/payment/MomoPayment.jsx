import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Upload, Clock, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Countdown in seconds (15 minutes)
const EXPIRE_SECONDS = 15 * 60

/**
 * MomoPayment Component
 * 3-step flow:
 *   Step 1 → Show dynamic QR with auto-filled amount + note
 *   Step 2 → Upload proof screenshot (or enter transaction ID)
 *   Step 3 → Pending confirmation + poll every 10s
 */
export default function MomoPayment({ paymentId, onSuccess, onExpire }) {
  const { user } = useAuth()
  const { t } = useTranslation()

  // QR data from backend
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState('')

  // UI state
  const [step, setStep] = useState(1) // 1 = QR, 2 = upload proof, 3 = pending
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(EXPIRE_SECONDS)
  const [expired, setExpired] = useState(false)

  // Proof upload
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [txnIdInput, setTxnIdInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Polling
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const pollRef = useRef(null)
  const fileInputRef = useRef(null)

  // ─── Fetch QR data from backend ───────────────────────────────────────────
  const userId = user?.id || user?._id
  const userToken = user?.token

  useEffect(() => {
    if (!paymentId || !userId) return

    const fetchQrData = async () => {
      setQrLoading(true)
      setQrError('')
      try {
        const token = userToken || localStorage.getItem('authToken')
        const res = await fetch(`${API_BASE}/payments/${paymentId}/momo-qr`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || 'Không lấy được thông tin QR')
        }
        const json = await res.json()
        setQrData(json.data)
      } catch (e) {
        setQrError(e.message)
      } finally {
        setQrLoading(false)
      }
    }

    fetchQrData()
  }, [paymentId, userId, userToken])

  // ─── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (expired || step === 3) return
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer)
          setExpired(true)
          onExpire?.()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [expired, step, onExpire])

  // ─── Polling for status change ─────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const token = userToken || localStorage.getItem('authToken')
        const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const json = await res.json()
        const status = json.data?.status
        if (status === 'success') {
          clearInterval(pollRef.current)
          pollRef.current = null
          setPaymentStatus('success')
          onSuccess?.()
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(pollRef.current)
          pollRef.current = null
          setPaymentStatus(status)
        }
      } catch {
        // silent — keep polling
      }
    }, 10000)
  }, [paymentId, userToken, onSuccess])

  useEffect(() => {
    if (step === 3) startPolling()
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [step, startPolling])

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const copyNote = async () => {
    if (!qrData?.note) return
    await navigator.clipboard.writeText(qrData.note)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Chỉ chấp nhận ảnh jpg, png hoặc webp')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File phải nhỏ hơn 5MB')
      return
    }
    setUploadError('')
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const handleSubmitProof = async () => {
    if (!proofFile && !txnIdInput.trim()) {
      setUploadError('Vui lòng upload ảnh chụp màn hình hoặc nhập mã giao dịch')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const token = user?.token || localStorage.getItem('authToken')
      const formData = new FormData()
      if (proofFile) formData.append('proof', proofFile)
      if (txnIdInput.trim()) formData.append('transactionId', txnIdInput.trim())

      const res = await fetch(`${API_BASE}/payments/${paymentId}/proof`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Upload thất bại')
      }

      setStep(3)
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (qrLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải thông tin thanh toán...</p>
      </div>
    )
  }

  if (qrError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <XCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-red-500">{qrError}</p>
      </div>
    )
  }

  // Step 3 — Waiting for admin confirmation
  if (step === 3) {
    if (paymentStatus === 'success') {
      return (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {t('payment.paymentSuccess')}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {t('payment.successMessage')}
            </p>
          </div>
        </div>
      )
    }

    if (paymentStatus === 'failed') {
      return (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="font-semibold text-red-600 dark:text-red-400">Thanh toán bị từ chối</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Vui lòng liên hệ hỗ trợ hoặc thử lại
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            {t('momo.pendingConfirmation')}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Admin sẽ xác nhận trong vài phút. Trang tự cập nhật.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Đừng đóng trang này cho đến khi nhận xác nhận</span>
        </div>
      </div>
    )
  }

  // Step 2 — Upload proof
  if (step === 2) {
    return (
      <div className="space-y-5">
        {/* Order summary strip */}
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">{qrData.orderNumber}</span>
          <span className="font-bold text-pink-600 dark:text-pink-400">{formatVND(qrData.amountVND)}</span>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
            {t('momo.uploadProof')}
          </p>

          {/* File drop zone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition cursor-pointer ${
              proofFile
                ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10'
            }`}
          >
            {proofPreview ? (
              <img src={proofPreview} alt="proof" className="max-h-36 rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="w-7 h-7 text-zinc-400" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Chụp màn hình giao dịch MoMo rồi upload tại đây
                </span>
                <span className="text-xs text-zinc-400">jpg / png / webp · tối đa 5MB</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          hoặc nhập mã giao dịch
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <input
          type="text"
          value={txnIdInput}
          onChange={(e) => setTxnIdInput(e.target.value)}
          placeholder="Mã giao dịch MoMo (VD: F123456789)"
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-400"
        />

        {uploadError && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {uploadError}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep(1)}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleSubmitProof}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-pink-600 hover:bg-pink-700 text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Đang gửi...' : 'Xác nhận đã chuyển'}
          </button>
        </div>
      </div>
    )
  }

  // Step 1 — QR display
  return (
    <div className="space-y-5">
      {/* Expired banner */}
      {expired && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          Đơn hàng đã hết thời gian. Vui lòng tạo đơn mới.
        </div>
      )}

      {/* Account info */}
      <div className="text-center">
        <p className="font-semibold text-zinc-900 dark:text-white">{t('momo.accountName')}</p>
        <p className="text-lg font-bold text-pink-600 dark:text-pink-400 mt-0.5">
          {qrData.accountName}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">*******061</p>
      </div>

      {/* QR — generated from deepLink (phone embedded, never shown) */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          {qrData.deepLink ? (
            <QRCodeSVG
              value={qrData.deepLink}
              size={200}
              level="M"
              includeMargin={false}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-400 text-sm">
              Không có QR
            </div>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('momo.amountVND')}</p>
        <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
          {formatVND(qrData.amountVND)}
        </p>
        <p className="text-xs text-zinc-400 mt-1">(≈ ${qrData.amountUSD?.toFixed(2)} USD)</p>
      </div>

      {/* Transfer note — copyable */}
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">{t('momo.transferNote')}</p>
        <button
          onClick={copyNote}
          className="w-full flex items-center justify-between gap-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl px-4 py-3 transition group"
        >
          <span className="font-mono font-semibold text-zinc-900 dark:text-white tracking-wide">
            {qrData.note}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 flex-shrink-0">
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">{t('momo.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                {t('momo.copyNote')}
              </>
            )}
          </span>
        </button>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          Nhập đúng nội dung này khi chuyển khoản
        </p>
      </div>

      {/* Steps guide */}
      <ol className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 list-none">
        {[
          'Mở app MoMo → Chuyển tiền → Quét mã QR',
          'Số tiền & nội dung tự điền sẵn, kiểm tra lại',
          'Nhấn Xác nhận để hoàn tất giao dịch',
        ].map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center flex-shrink-0 font-bold" style={{ fontSize: 10 }}>
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      {/* Countdown */}
      <div className={`flex items-center justify-center gap-2 text-sm font-medium ${
        timeLeft < 120 ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'
      }`}>
        <Clock className="w-4 h-4" />
        {t('momo.expiresIn')}: {formatTime(timeLeft)}
      </div>

      {/* Next step button */}
      <button
        onClick={() => setStep(2)}
        disabled={expired}
        className="w-full py-3 rounded-xl font-semibold bg-pink-600 hover:bg-pink-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Đã chuyển khoản
      </button>
    </div>
  )
}
