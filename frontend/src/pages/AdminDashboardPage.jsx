import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, MessageSquare, Upload, TrendingUp, Activity, Shield, AlertCircle, CheckCircle, Server, Zap, Loader } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { adminAPI } from '../services/api'
import { Link } from 'react-router-dom'

const RESOURCE_TYPES = [
  { name: 'PDF', value: 48 },
  { name: 'DOCX', value: 22 },
  { name: 'Images', value: 18 },
  { name: 'TXT', value: 12 },
]

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981']

const SYSTEM_HEALTH = [
  { service: 'API Server', status: 'operational', latency: '12ms' },
  { service: 'SQLite DB', status: 'operational', latency: '4ms' },
  { service: 'IBM watsonx.ai', status: 'demo', latency: 'N/A' },
  { service: 'IBM Cloud Storage', status: 'demo', latency: 'N/A' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

export default function AdminDashboardPage() {
  const [apiStats, setApiStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentLog] = useState([
    { id: 1, agent: 'PerformanceAgent', event: 'Analysed quiz results for 3 students', time: '2 min ago', type: 'info' },
    { id: 2, agent: 'QuizAgent', event: 'Generated 15-question quiz for Data Structures', time: '8 min ago', type: 'success' },
    { id: 3, agent: 'TutorAgent', event: 'Answered question via RAG pipeline', time: '12 min ago', type: 'info' },
    { id: 4, agent: 'Orchestrator', event: 'Low score trigger — tutor + practice quiz delivered', time: '25 min ago', type: 'warning' },
    { id: 5, agent: 'ResourceAgent', event: 'Processed PDF — extracted 42 topics', time: '1 hr ago', type: 'success' },
  ])

  useEffect(() => {
    Promise.allSettled([
      adminAPI.getStats(),
      adminAPI.getUsers({ limit: 5 }),
    ]).then(([statsRes, usersRes]) => {
      if (statsRes.status === 'fulfilled') setApiStats(statsRes.value)
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || [])
    }).finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      label: 'Total Students',
      value: loading ? '—' : (apiStats?.total_students ?? 0).toLocaleString(),
      change: 'Registered accounts',
      icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/15',
    },
    {
      label: 'Active Users',
      value: loading ? '—' : (apiStats?.active_users ?? 0).toLocaleString(),
      change: 'Active accounts',
      icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/15',
    },
    {
      label: 'Resources Uploaded',
      value: loading ? '—' : (apiStats?.total_resources ?? 0).toLocaleString(),
      change: 'Total materials',
      icon: Upload, color: 'text-violet-400', bg: 'bg-violet-500/15',
    },
    {
      label: 'Quizzes Taken',
      value: loading ? '—' : (apiStats?.total_quizzes ?? 0).toLocaleString(),
      change: 'Total attempts',
      icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/15',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Platform management &amp; analytics overview</p>
          </div>
          {loading && <Loader className="w-4 h-4 text-indigo-400 animate-spin ml-auto" />}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
            <div className="stat-card card-hover">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs font-medium">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              {loading
                ? <div className="h-7 w-20 shimmer rounded-lg mt-1" />
                : <div className="text-2xl font-display font-bold text-white">{s.value}</div>
              }
              <div className="text-xs text-gray-500">{s.change}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Agent Activity Log */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h2 className="text-white font-semibold">Agent Activity Log</h2>
              <span className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
                Live
              </span>
            </div>
            <div className="space-y-2">
              {agentLog.map((log) => (
                <div key={log.id} className={`flex items-start gap-3 p-3 rounded-xl ${
                  log.type === 'warning' ? 'bg-amber-500/5 border border-amber-500/15' :
                  log.type === 'success' ? 'bg-emerald-500/5 border border-emerald-500/15' :
                  'bg-gray-800/40 border border-gray-700/40'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    log.type === 'warning' ? 'bg-amber-400' :
                    log.type === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        log.type === 'warning' ? 'text-amber-400' :
                        log.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'
                      }`}>{log.agent}</span>
                      <span className="text-gray-600 text-xs ml-auto">{log.time}</span>
                    </div>
                    <p className="text-gray-300 text-xs mt-0.5">{log.event}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4 text-center">Agent activity logs refresh on page load.</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-4">Resource Types</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={RESOURCE_TYPES} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {RESOURCE_TYPES.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Real users from API */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Registrations</h2>
              <Link to="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-gray-800/40 animate-pulse" />)}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((u, i) => (
                  <div key={u.id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{u.name}</p>
                      <p className="text-gray-500 text-xs truncate">{u.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                        {u.is_active ? 'active' : 'inactive'}
                      </span>
                      <p className="text-gray-600 text-xs mt-0.5 capitalize">{u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">No users found.</p>
            )}
          </div>
        </motion.div>

        {/* System health */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-indigo-400" />
              <h2 className="text-white font-semibold">System Health</h2>
            </div>
            <div className="space-y-3">
              {SYSTEM_HEALTH.map((service, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    {service.status === 'operational' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-gray-200 text-sm">{service.service}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">{service.latency}</span>
                    <span className={`badge ${
                      service.status === 'operational'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4">
              IBM services show "demo" status until valid watsonx.ai credentials are configured.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
