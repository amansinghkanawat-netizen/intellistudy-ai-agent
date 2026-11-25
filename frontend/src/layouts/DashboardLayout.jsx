import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardTopbar from '../components/dashboard/DashboardTopbar'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export default function DashboardLayout({ isAdmin = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const sidebarWidth = collapsed ? 68 : 256

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #060412 0%, #0d0a24 40%, #060d1f 100%)' }}>
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="orb orb-indigo absolute w-96 h-96 top-[-80px] left-16 opacity-20" />
        <div className="orb orb-violet absolute w-80 h-80 bottom-20 left-48 opacity-15" />
        <div className="orb orb-cyan absolute w-72 h-72 top-1/3 right-8 opacity-10" />
        <div className="orb orb-indigo absolute w-64 h-64 bottom-10 right-1/4 opacity-10" />
      </div>

      {/* Fine grid overlay */}
      <div className="pointer-events-none fixed inset-0 bg-grid-fine opacity-30 z-0" />

      {/* Sidebar */}
      <Sidebar
        isAdmin={isAdmin}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Main content — single area, margin animated on desktop */}
      <div
        className="relative z-10 flex-1 flex flex-col min-w-0"
        style={{ marginLeft: 0 }}
      >
        {/* On desktop, shift right to clear the fixed sidebar */}
        <style>{`
          @media (min-width: 1024px) {
            .dashboard-main { margin-left: ${sidebarWidth}px; transition: margin-left 0.22s cubic-bezier(0.4,0,0.2,1); }
          }
        `}</style>

        <div className="dashboard-main relative z-10 flex-1 flex flex-col min-w-0">
          <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
