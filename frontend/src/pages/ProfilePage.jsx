import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, GraduationCap, Shield, Edit2, Save, X,
  Lock, Eye, EyeOff, BookOpen, Brain, Layers, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI, dashboardAPI, quizAPI, flashcardAPI } from '../services/api'
import toast from 'react-hot-toast'

const EDUCATION_LEVELS = [
  "High School",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Certification",
]

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  // Profile edit state
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    education_level: user?.education_level || "Bachelor's Degree",
  })
  const [saving, setSaving] = useState(false)

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwErrors, setPwErrors] = useState({})

  // Stats
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Load real stats from APIs
    Promise.allSettled([
      dashboardAPI.getStats(),
      quizAPI.history(),
      flashcardAPI.list(),
    ]).then(([statsRes, quizRes, flashRes]) => {
      const s = statsRes.status === 'fulfilled' ? statsRes.value : {}
      const quizzes = quizRes.status === 'fulfilled' ? quizRes.value : []
      const flashSets = flashRes.status === 'fulfilled' ? flashRes.value : []
      setStats({
        resources: s.total_resources || 0,
        quizzes: quizzes.length || 0,
        flashcard_sets: flashSets.length || 0,
        study_hours: s.study_hours_this_week || 0,
      })
    })
  }, [])

  const saveProfile = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return toast.error('Name must be at least 2 characters')
    }
    setSaving(true)
    try {
      const updated = await authAPI.updateProfile({
        name: form.name.trim(),
        education_level: form.education_level,
      })
      updateUser({ name: updated.name, education_level: updated.education_level })
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch {
      /* error handled globally */
    } finally {
      setSaving(false)
    }
  }

  const validatePassword = () => {
    const errors = {}
    if (!pwForm.current) errors.current = 'Current password is required'
    if (!pwForm.newPw) errors.newPw = 'New password is required'
    else if (pwForm.newPw.length < 8) errors.newPw = 'Must be at least 8 characters'
    if (pwForm.newPw !== pwForm.confirm) errors.confirm = 'Passwords do not match'
    setPwErrors(errors)
    return Object.keys(errors).length === 0
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return
    setPwSaving(true)
    try {
      await authAPI.changePassword(pwForm.current, pwForm.newPw)
      setPwForm({ current: '', newPw: '', confirm: '' })
      setPwErrors({})
      toast.success('Password changed successfully!')
    } catch {
      /* error handled globally */
    } finally {
      setPwSaving(false)
    }
  }

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">My Profile</h1>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 flex items-center gap-5"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-glow flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-xl font-semibold truncate">{user?.name}</h2>
          <p className="text-gray-400 text-sm truncate">{user?.email}</p>
          <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user?.role === 'admin'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            {user?.role === 'admin' ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
            {user?.role === 'admin' ? 'Administrator' : 'Student'}
          </span>
        </div>
        <button
          onClick={() => { setEditing(!editing); setForm({ name: user?.name || '', education_level: user?.education_level || "Bachelor's Degree" }) }}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 flex-shrink-0"
        >
          {editing ? <><X className="w-3.5 h-3.5" />Cancel</> : <><Edit2 className="w-3.5 h-3.5" />Edit</>}
        </button>
      </motion.div>

      {/* Account details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6 space-y-5"
      >
        <h3 className="text-white font-semibold">Account Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          {editing ? (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field pl-10"
                placeholder="Your full name"
              />
            </div>
          ) : (
            <p className="text-white px-4 py-3 bg-gray-800/40 rounded-xl">{user?.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/40 rounded-xl">
            <Mail className="w-4 h-4 text-gray-500" />
            <p className="text-gray-400">{user?.email}</p>
            <span className="ml-auto text-xs text-gray-600">Cannot change</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
          {editing ? (
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={form.education_level}
                onChange={(e) => setForm({ ...form, education_level: e.target.value })}
                className="input-field pl-10 appearance-none"
              >
                {EDUCATION_LEVELS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ) : (
            <p className="text-white px-4 py-3 bg-gray-800/40 rounded-xl">
              {user?.education_level || "Bachelor's Degree"}
            </p>
          )}
        </div>

        {editing && (
          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Save className="w-4 h-4" />Save Changes</>
            }
          </button>
        )}
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h3 className="text-white font-semibold mb-5">Change Password</h3>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
            <PasswordInput
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              placeholder="Enter current password"
            />
            {pwErrors.current && <p className="text-red-400 text-xs mt-1">{pwErrors.current}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <PasswordInput
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              placeholder="Minimum 8 characters"
            />
            {pwErrors.newPw && <p className="text-red-400 text-xs mt-1">{pwErrors.newPw}</p>}
            {pwForm.newPw && (
              <div className="mt-2 flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      pwForm.newPw.length >= i * 3
                        ? pwForm.newPw.length >= 12 ? 'bg-emerald-500' : pwForm.newPw.length >= 8 ? 'bg-amber-500' : 'bg-red-500'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <PasswordInput
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="Repeat new password"
            />
            {pwErrors.confirm && <p className="text-red-400 text-xs mt-1">{pwErrors.confirm}</p>}
            {pwForm.confirm && pwForm.newPw === pwForm.confirm && (
              <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
          >
            {pwSaving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Lock className="w-4 h-4" />Update Password</>
            }
          </button>
        </form>
      </motion.div>

      {/* Real stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6"
      >
        <h3 className="text-white font-semibold mb-4">Learning Summary</h3>
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Resources', value: stats.resources, icon: BookOpen },
              { label: 'Quizzes', value: stats.quizzes, icon: Brain },
              { label: 'Flashcard Sets', value: stats.flashcard_sets, icon: Layers },
              { label: 'Study Hours', value: stats.study_hours, icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-gray-800/40">
                <s.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-display font-bold gradient-text">{s.value}</div>
                <div className="text-gray-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-800/40 animate-pulse" />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
