/**
 * Shared UI Components — IntelliStudy Design System
 * All reusable primitive components live here.
 */
import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, AlertTriangle, Info, CheckCircle, Inbox } from 'lucide-react'

// ─── Skeleton Loaders ──────────────────────────────────────────────────────
export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return <div className={`${width} ${height} shimmer rounded-lg ${className}`} />
}

export function SkeletonCard({ rows = 3, className = '' }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <SkeletonLine width="w-1/3" height="h-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === rows - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <SkeletonLine width="w-20" height="h-3" />
        <div className="w-8 h-8 shimmer rounded-lg" />
      </div>
      <SkeletonLine width="w-24" height="h-7" className="mb-1" />
      <SkeletonLine width="w-28" height="h-3" />
    </div>
  )
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40">
          <div className="w-9 h-9 shimmer rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-3/4" />
            <SkeletonLine width="w-1/2" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Loading Spinner ───────────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin`} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  )
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center min-h-64 w-full">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-indigo-400/60" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  )
}

// ─── Demo Mode Banner ──────────────────────────────────────────────────────
export function DemoModeBanner({ message }) {
  return (
    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-amber-300 text-xs">
        <span className="font-bold">DEMO MODE</span> —{' '}
        {message || 'Sample data shown. Configure IBM watsonx.ai credentials in .env for real AI.'}
      </p>
    </div>
  )
}

// ─── Alert Banners ─────────────────────────────────────────────────────────
const ALERT_STYLES = {
  warning: { border: 'border-amber-500/25 bg-amber-500/5', icon: AlertTriangle, iconColor: 'text-amber-400', textColor: 'text-amber-300' },
  info:    { border: 'border-blue-500/25 bg-blue-500/5',   icon: Info,          iconColor: 'text-blue-400',  textColor: 'text-blue-300' },
  success: { border: 'border-emerald-500/25 bg-emerald-500/5', icon: CheckCircle, iconColor: 'text-emerald-400', textColor: 'text-emerald-300' },
  error:   { border: 'border-red-500/25 bg-red-500/5',     icon: AlertTriangle, iconColor: 'text-red-400',   textColor: 'text-red-300' },
}

export function Alert({ type = 'info', children, className = '' }) {
  const s = ALERT_STYLES[type]
  const Icon = s.icon
  return (
    <div className={`p-3 rounded-xl border ${s.border} flex items-start gap-2.5 ${className}`}>
      <Icon className={`w-4 h-4 ${s.iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`${s.textColor} text-xs`}>{children}</p>
    </div>
  )
}

// ─── Page Header ───────────────────────────────────────────────────────────
export function PageHeader({ title, description, action, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{title}</h1>
          {badge && (
            <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-xs">{badge}</span>
          )}
        </div>
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'text-indigo-400', bg = 'bg-indigo-500/15', trend, loading = false }) {
  return (
    <div className="stat-card card-hover">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          {loading ? <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin opacity-50" /> : <Icon className={`w-4 h-4 ${color}`} />}
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-20 shimmer rounded-lg mt-1" />
      ) : (
        <div className="text-2xl font-display font-bold text-white">{value}</div>
      )}
      {loading ? (
        <div className="h-3 w-28 shimmer rounded mt-1" />
      ) : (
        <div className="text-xs text-gray-500">{sub}</div>
      )}
    </div>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card p-6 max-w-sm w-full"
      >
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-sm">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'bg-indigo-500', className = '' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={`h-2 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  )
}

// ─── Score Badge ───────────────────────────────────────────────────────────
export function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
  return <span className={`badge ${color} font-bold`}>{score}%</span>
}

// ─── Tooltip ───────────────────────────────────────────────────────────────
export function Tooltip({ children, text }) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 whitespace-nowrap z-10 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}

// ─── Search Input ──────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-10"
      />
    </div>
  )
}

// ─── Tab Bar ───────────────────────────────────────────────────────────────
export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.icon && <tab.icon className="w-4 h-4" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-indigo-500/30' : 'bg-gray-700'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
