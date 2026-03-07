import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Github, Twitter, Youtube, Mail } from "lucide-react"

const LINKS = {
  explore: [
    { label: "home.featured", fallback: "Featured", path: "/" },
    { label: "navbar.browseAll", fallback: "Browse All", path: "/browse-all" },
    { label: "navbar.categories", fallback: "Categories", path: "/categories" },
    { label: "navbar.wishlist", fallback: "Wishlist", path: "/wishlist" },
  ],
  account: [
    { label: "navbar.orders", fallback: "Orders", path: "/orders" },
    { label: "navbar.downloads", fallback: "Downloads", path: "/downloads" },
    { label: "navbar.myProfile", fallback: "Profile", path: "/profile" },
    { label: "navbar.settings", fallback: "Settings", path: "/settings" },
  ],
}

const SOCIAL = [
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Mail, href: "#", label: "Email" },
]

export default function Footer() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-zinc-950 text-zinc-400 mt-16">
      {/* Top gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">GameSmith</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-500 mb-4">
              The marketplace for high-quality game assets — 3D models, textures, audio, and more.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                >
                  <Icon size={15} className="text-zinc-400 hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5">
              {LINKS.explore.map(({ label, fallback, path }) => (
                <li key={path}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {t(label, fallback)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2.5">
              {LINKS.account.map(({ label, fallback, path }) => (
                <li key={path}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {t(label, fallback)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-zinc-800 flex items-center justify-center">
          <p className="text-xs text-zinc-600">© {year} GameSmith. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
