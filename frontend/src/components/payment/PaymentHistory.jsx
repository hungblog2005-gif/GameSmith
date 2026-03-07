import { useState, useEffect } from 'react'
import { Download, Eye, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * PaymentHistory Component
 * Hiển thị lịch sử thanh toán và đơn hàng của user
 */
export default function PaymentHistory() {
  const { user, getAuthHeaders } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  // Fetch payment history
  useEffect(() => {
    if (!user) return
    
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/payments/user/${user.id}?page=${currentPage}&limit=10`, {
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPayments(data.payments || [])
          setPagination(data.pagination || { total: 0, pages: 1 })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Payment history error:', err)
        setError('Lỗi khi tải lịch sử thanh toán')
        setLoading(false)
      })
  }, [user, currentPage])

  const getStatusBadge = (status) => {
    const statusMap = {
      success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Thành công' },
      pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'Đang xử lý' },
      failed: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'Thất bại' },
    }
    const config = statusMap[status] || statusMap.pending
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {status === 'success' && <CheckCircle2 size={14} />}
        {status === 'pending' && <Loader2 size={14} className="animate-spin" />}
        {status === 'failed' && <AlertCircle size={14} />}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDownload = async (assetId, assetTitle) => {
    // For now, just redirect to download endpoint
    // In a real app, you'd verify the user owned the asset first
    setDownloadingId(assetId)
    try {
      // Simulate download - in production, direct to download API
      window.open(`${API_BASE}/assets/${assetId}/download`, '_blank')
      // After a delay, reset the loading state
      setTimeout(() => setDownloadingId(null), 2000)
    } catch (error) {
      console.error('Download error:', error)
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-zinc-400" />
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">Bạn chưa có đơn hàng nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">Giá</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">Ngày mua</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">Trạng thái</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-white">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const assetTitle = payment.order?.items?.[0]?.asset?.title || 'Sản phẩm'
              const assetId = payment.order?.items?.[0]?.asset?._id
              return (
                <tr key={payment._id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                  {/* Product */}
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                        {assetTitle}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        ID: {payment._id.substring(0, 8)}...
                      </p>
                    </div>
                  </td>
                  {/* Amount */}
                  <td className="px-4 py-4">
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      ${payment.amount?.toFixed(2) || '0.00'}
                    </p>
                  </td>
                  {/* Date */}
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(payment.created_at)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.status === 'success' && assetId && (
                        <button
                          onClick={() => handleDownload(assetId, assetTitle)}
                          disabled={downloadingId === assetId}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingId === assetId ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              Tải
                            </>
                          )}
                        </button>
                      )}
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white text-xs font-medium rounded transition">
                        <Eye size={14} />
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 text-sm"
          >
            Trước
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded text-sm transition ${
                currentPage === page
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                  : 'border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
            disabled={currentPage === pagination.pages}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 text-sm"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
