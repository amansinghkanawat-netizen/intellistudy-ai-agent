import React from 'react'
import { Menu, Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function DashboardTopbar({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl px-4 md:px-6 h-16 flex items-center justify-between gap-4" style={{background:'linear-gradient(135deg,rgba(10,8,26,0.92) 0%,rgba(13,10,36,0.92) 100%)',borderBottom:'1px solid rgba(99,102,241,0.15)',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 w-56 md:w-72" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search materials, quizzes..."
            className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}} />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',boxShadow:'0 0 12px rgba(99,102,241,0.4)'}}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-white text-sm font-medium leading-tight">{user?.name || 'Student'}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role || 'student'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
