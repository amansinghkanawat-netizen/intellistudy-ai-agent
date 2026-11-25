import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Zap, CheckCircle } from 'lucide-react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required')
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Enter a valid email address')
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword(email.trim())
      setSubmitted(true)
    } catch {
      // handled globally
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to sign in
        </Link>

        <div className="card p-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-glow">
            <Zap className="w-7 h-7 text-white" />
          </div>

          {!submitted ? (
            <>
              <h1 className="text-2xl font-display font-bold text-white mb-2">Forgot your password?</h1>
              <p className="text-gray-400 text-sm mb-6">
                No worries! Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="you@university.edu"
                      className={`input-field pl-10 ${error ? 'border-red-500/60' : ''}`}
                    />
                  </div>
                  {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">
                We've sent a password reset link to <span className="text-indigo-400">{email}</span>.
                Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2">
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
