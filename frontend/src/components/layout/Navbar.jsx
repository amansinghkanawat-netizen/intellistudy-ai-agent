import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'navbar-scrolled py-3' : 'py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',boxShadow:'0 0 20px rgba(99,102,241,0.45)'}}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">
            Intelli<span className="gradient-text">Study</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm py-2.5 px-5">
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2.5 px-5">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-gray-950/97 backdrop-blur-xl" style={{borderColor:'rgba(99,102,241,0.15)'}}
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-gray-800 pt-3 mt-1 flex flex-col gap-2">
                {user ? (
                  <Link to="/dashboard" className="btn-primary text-center text-sm" onClick={() => setMobileOpen(false)}>
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary text-center text-sm" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                    <Link to="/register" className="btn-primary text-center text-sm" onClick={() => setMobileOpen(false)}>
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
