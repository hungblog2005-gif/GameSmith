import { useState } from "react"
import Navbar from "../components/navigation/Navbar"
import Sidebar from "../components/navigation/Sidebar"

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex flex-1">
          {/* Sidebar - Always ẩn trên desktop, chỉ hiện khi click hamburger */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
  )
}
