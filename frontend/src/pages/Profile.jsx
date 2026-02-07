import { useState, useContext } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { UserDataContext } from "../context/UserDataContext"
import { User, Mail, Phone, MapPin, Calendar, ShoppingBag, Heart, Download, Lock, LogOut } from "lucide-react"

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { ordersCount, wishlistCount, downloadsCount } = useContext(UserDataContext)
  const [activeTab, setActiveTab] = useState("personal")
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: "+1 (555) 000-0000",
    address: "123 Main Street",
    city: "San Francisco",
    country: "United States"
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveChanges = () => {
    setEditMode(false)
    // API call would go here
  }

  const stats = [
    { label: t("profile.totalPurchases"), value: ordersCount.toString(), icon: ShoppingBag },
    { label: t("profile.favoriteCount"), value: wishlistCount.toString(), icon: Heart },
    { label: t("profile.downloadCount"), value: downloadsCount.toString(), icon: Download }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
            {t("profile.myProfile")}
          </h1>

          {/* Profile Card */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt={formData.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {formData.name}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("profile.joinDate")}: December 15, 2023
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
              >
                {editMode ? t("common.cancel") : t("profile.personalInfo")}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <Icon size={24} className="mx-auto text-zinc-400 mb-2" />
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {stat.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === "personal"
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t("profile.personalInfo")}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === "security"
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t("profile.accountSettings")}
          </button>
        </div>

        {/* Content */}
        {activeTab === "personal" && (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
              {t("profile.accountInfo")}
            </h3>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.address")}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                      {t("profile.city")}
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                      {t("profile.country")}
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveChanges}
                    className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
                  >
                    {t("profile.saveChanges")}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("profile.email")}</p>
                    <p className="text-zinc-900 dark:text-white">{formData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("profile.phone")}</p>
                    <p className="text-zinc-900 dark:text-white">{formData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("profile.address")}</p>
                    <p className="text-zinc-900 dark:text-white">{formData.address}, {formData.city}, {formData.country}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock size={20} className="text-zinc-600 dark:text-zinc-400" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t("profile.changePassword")}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.currentPassword")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.newPassword")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.confirmNewPassword")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>
                <button className="w-full px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition">
                  {t("profile.changePassword")}
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut size={18} />
              {t("profile.logout")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
