import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Layers, Brain, MessageSquare,
  Calendar, GitBranch, TrendingUp, User,
  LogOut, Zap, X, Shield, Users, ChevronLeft, ChevronRight, Target
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const STUDENT_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Study Generator', icon: BookOpen, to: '/study-generator' },
  { label: 'AI Tutor', icon: Brain, to: '/tutor' },
  { label: 'Flashcards', icon: Layers, to: '/flashcards' },
  { label: 'Quiz', icon: MessageSquare, to: '/quiz' },
  { label: 'Exam Prep', icon: Target, to: '/exam-prep' },
  { label: 'Concept Map', icon: GitBranch, to: '/concept-map' },
  { label: 'Study Planner', icon: Calendar, to: '/planner' },
  { label: 'Analytics', icon: TrendingUp, to: '/analytics' },
]

const ADMIN_NAV = [
  { label: 'Admin Dashboard', icon: Shield, to: '/admin' },
  { label: 'Users', icon: Users, to: '/admin/users' },
]

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard' || item.to === '/admin'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
          isActive
            ? 'sidebar-active text-indigo-300'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

export default function Sidebar({ isAdmin, open, onClose, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed && !isMobile ? 'w-8' : ''}`}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center animate-glow-pulse flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="text-lg font-display font-bold text-white overflow-hidden whitespace-nowrap"
              >
                Intelli<span className="gradient-text">Study</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all"
            >
              {collapsed
                ? <ChevronRight className="w-4 h-4" />
                : <ChevronLeft className="w-4 h-4" />
              }
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed && !isMobile} />
        ))}
      </nav>

      {/* User section */}
      <div className={`px-3 py-4 border-t border-gray-800/60 space-y-1 flex-shrink-0 ${collapsed && !isMobile ? 'items-center' : ''}`}>
        <NavLink
          to="/profile"
          title={collapsed && !isMobile ? 'Profile' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${collapsed && !isMobile ? 'justify-center' : ''} ${
              isActive ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <User className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Profile
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User info — hidden when collapsed */}
        <AnimatePresence initial={false}>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-3 px-3 py-3 rounded-xl bg-gray-800/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{user?.name || 'Student'}</p>
                  <p className="text-gray-500 text-xs truncate">{user?.email || ''}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full sidebar-bg z-40 overflow-hidden"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-full w-64 sidebar-bg z-50"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
