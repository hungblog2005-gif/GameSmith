import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { UserDataContext } from "../context/UserDataContext"
import { Download, FileText, Calendar, ExternalLink } from "lucide-react"

export default function Downloads() {
  const { t } = useTranslation()
  const { downloads } = useContext(UserDataContext)

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("downloads.myDownloads")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {downloads.length} {t("downloads.title").toLowerCase()}
          </p>
        </div>

        {/* Downloads List */}
        {downloads.length === 0 ? (
          <div className="text-center py-16">
            <Download size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("downloads.emptyDownloads")}
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
            >
              {t("downloads.download")}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads.map((item) => (
              <div
                key={item.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-md dark:hover:shadow-none transition flex gap-4"
              >
                {/* Thumbnail */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate mb-2">
                    {item.fileName}
                  </p>
                  
                  {/* File Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      {item.fileSize}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(item.downloadDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      {t("downloads.downloaded")}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-shrink-0">
                  <button className="flex items-center justify-center w-10 h-10 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    <Download size={18} />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
