import { useState, useContext } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { UserDataContext } from "../context/UserDataContext"
import { User, Mail, Phone, MapPin, Calendar, Heart, Download } from "lucide-react"

export default function Profile() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, updateAvatar, updateProfile, isLoading } = useAuth()
  const { wishlistCount, downloadsCount } = useContext(UserDataContext)
  const [activeTab, setActiveTab] = useState("personal")
  const [editMode, setEditMode] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    postal_code: user?.postal_code || "",
    date_of_birth: user?.date_of_birth
      ? String(user.date_of_birth).split("T")[0]
      : "",
    gender: user?.gender || ""
  })

  const displayName =
    `${formData.first_name} ${formData.last_name}`.trim() ||
    user?.username ||
    "User"

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveChanges = async () => {
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      postal_code: formData.postal_code,
      gender: formData.gender,
    }
    // Only include date_of_birth if it has a value (empty string fails backend @IsDateString)
    if (formData.date_of_birth) {
      payload.date_of_birth = formData.date_of_birth
    }

    const result = await updateProfile(payload)

    if (!result.success) {
      setSaveError(result.message)
      return
    }

    setSaveError("")
    setEditMode(false)
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await updateAvatar(file)
    if (!result.success) {
      setAvatarError(result.message)
    } else {
      setAvatarError("")
    }

    event.target.value = ""
  }

  const stats = [
    { label: t("profile.favoriteCount"), value: (wishlistCount || 0).toString(), icon: Heart },
    { label: t("profile.downloadCount"), value: (downloadsCount || 0).toString(), icon: Download }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("profile.loginRequired") || "Vui lòng đăng nhập để xem hồ sơ"}</p>
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
            {t("profile.myProfile")}
          </h1>

          {/* Profile Card */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src={user?.avatar_url || user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {displayName}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("profile.joinDate")}: December 15, 2023
                  </p>
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isLoading}
                        className="hidden"
                      />
                      <span className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                        Change avatar
                      </span>
                    </label>
                    {avatarError && (
                      <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
                        {avatarError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition self-start sm:self-auto"
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
        </div>

        {/* Content */}
        {activeTab === "personal" && (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
              {t("profile.accountInfo")}
            </h3>

            {editMode ? (
              <div className="space-y-4">
                {saveError && (
                  <div className="p-3 rounded-lg text-sm border border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200">
                    {saveError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">First name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">Last name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
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
                    disabled
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    {t("profile.phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
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

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">Postal code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">Date of birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
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
                    <p className="text-zinc-900 dark:text-white">{formData.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("profile.address")}</p>
                    <p className="text-zinc-900 dark:text-white">
                      {formData.address}, {formData.city}, {formData.country} {formData.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Date of birth</p>
                    <p className="text-zinc-900 dark:text-white">{formData.date_of_birth || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Gender</p>
                    <p className="text-zinc-900 dark:text-white">{formData.gender || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  )
}
