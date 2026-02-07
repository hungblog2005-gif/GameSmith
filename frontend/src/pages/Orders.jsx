import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { UserDataContext } from "../context/UserDataContext"
import { Download, TrendingUp, Calendar } from "lucide-react"

export default function Orders() {
  const { t } = useTranslation()
  const { orders } = useContext(UserDataContext)

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
      case "shipped":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
      case "pending":
        return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
      case "cancelled":
        return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
    }
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      delivered: t("orders.delivered"),
      shipped: t("orders.shipped"),
      pending: t("orders.pending"),
      cancelled: t("orders.cancelled")
    }
    return statusMap[status] || status
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("orders.myOrders")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("orders.myOrders")} ({orders.length})
          </p>
        </div>

        {/* Orders Container */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("orders.emptyOrders")}
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
            >
              {t("orders.startShopping")}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-md dark:hover:shadow-none transition"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                      {t("orders.orderNumber")} {order.id}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Calendar size={14} />
                      {new Date(order.date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Items */}
                <div className="mb-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-900 dark:text-white">
                          {item.name}
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                      {t("orders.total")}
                    </p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                      <Download size={18} />
                      {t("orders.redownload")}
                    </button>
                    <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition">
                      {t("orders.viewDetails")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
