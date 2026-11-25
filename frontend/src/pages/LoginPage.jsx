import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch {
      // error handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  // Demo login helper
  const fillDemo = (role) => {
    if (role === 'student') setForm({ email: 'demo@intellistudy.ai', password: 'Demo1234!' })
    else setForm({ email: 'admin@intellistudy.ai', password: 'Admin1234!' })
    setErrors({})
  }

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#060412 0%,#0d0a24 40%,#060d1f 100%)'}}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden" style={{background:'linear-gradient(135deg,#0a0618 0%,#1a0533 30%,#0d1a3d 70%,#060412 100%)'}}>
        <div className="absolute inset-0 bg-grid opacity-40" />
        {/* Orbs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)'}} />
        <div className="absolute -bottom-20 right-10 w-80 h-80 rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(139,92,246,0.18),transparent 70%)'}} />
        <div className="absolute top-1/2 right-0 w-60 h-60 rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)'}} />
        <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 text-center px-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',boxShadow:'0 0 40px rgba(99,102,241,0.5)'}}>
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-display font-extrabold text-white mb-3">
            Welcome Back to<br />
            <span className="gradient-text">IntelliStudy</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-xs mx-auto">Your AI-powered learning journey continues here.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">
              Intelli<span className="gradient-text">Study</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Sign in to your account</h1>
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one free</Link>
            </p>
          </div>

          {/* Demo mode banner */}
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              DEMO MODE — No real IBM credentials required
            </p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('student')} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-all font-medium">
                Student Demo
              </button>
              <button onClick={() => fillDemo('admin')} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-all font-medium">
                Admin Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@university.edu"
                  className={`input-field pl-10 ${errors.email ? 'border-red-500/60 focus:ring-red-500/40' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-500/60' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
