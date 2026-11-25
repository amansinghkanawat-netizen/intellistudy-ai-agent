import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, User, GraduationCap, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SCHOOLS = ['High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Professional Certification', 'Other']

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', education_level: 'Bachelor\'s Degree' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must include uppercase, lowercase, and a number'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        education_level: form.education_level,
      })
      toast.success(`Welcome to IntelliStudy, ${user.name}!`)
      navigate('/dashboard')
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ name, label, type = 'text', placeholder, icon: Icon, extra }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className={`input-field pl-10 ${extra || ''} ${errors[name] ? 'border-red-500/60' : ''}`}
        />
      </div>
      {errors[name] && <p className="mt-1.5 text-xs text-red-400">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#060412 0%,#0d0a24 40%,#060d1f 100%)'}}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden" style={{background:'linear-gradient(135deg,#0a0618 0%,#1a0533 30%,#0d1a3d 70%,#060412 100%)'}}>
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)'}} />
        <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(139,92,246,0.18),transparent 70%)'}} />
        <div className="absolute top-1/3 right-10 w-60 h-60 rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(6,182,212,0.1),transparent 70%)'}} />
        <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 text-center px-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',boxShadow:'0 0 40px rgba(99,102,241,0.5)'}}>
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-display font-extrabold text-white mb-3">
            Start Your<br />
            <span className="gradient-text">AI-Powered</span><br />
            Learning Journey
          </h2>
          <p className="text-gray-300 text-base max-w-xs mx-auto mt-3">
            Join 50,000+ students already studying smarter with IntelliStudy.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-left max-w-xs mx-auto">
            {['Generate summaries in seconds', 'AI quizzes from your own notes', 'Personalised study plans', 'Powered by IBM Granite AI'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-gray-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-indigo-500/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 text-xs">✓</span>
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">
              Intelli<span className="gradient-text">Study</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Create your account</h1>
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
            </p>
          </div>

          {/* Demo notice */}
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <p className="text-amber-400 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              DEMO MODE — Registrations are stored locally. IBM credentials not required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field name="name" label="Full Name" placeholder="Priya Sharma" icon={User} />
            <Field name="email" label="Email Address" type="email" placeholder="you@university.edu" icon={Mail} />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={form.education_level}
                  onChange={(e) => setForm({ ...form, education_level: e.target.value })}
                  className="input-field pl-10 appearance-none"
                >
                  {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars, upper + lower + number"
                  className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-500/60' : ''}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500/60' : ''}`}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By registering, you agree to our{' '}
              <a href="#" className="text-indigo-400 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-indigo-400 hover:underline">Privacy Policy</a>.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
