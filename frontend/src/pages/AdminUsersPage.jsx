import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Shield, GraduationCap, MoreVertical,
  Trash2, UserCheck, UserX, ChevronLeft, ChevronRight,
  RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROLES = ['all', 'student', 'admin']

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
      <Shield className="w-3 h-3" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
      <GraduationCap className="w-3 h-3" /> Student
    </span>
  )
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
      <CheckCircle2 className="w-3 h-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
      <UserX className="w-3 h-3" /> Suspended
    </span>
  )
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${danger ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              danger ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'btn-primary'
            }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function UserRow({ user, currentUserId, onToggleActive, onDelete, onRoleChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isSelf = user.id === currentUserId

  return (
    <tr className="border-t border-gray-800/60 hover:bg-white/[0.02] transition-colors group">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {user.name}
              {isSelf && <span className="ml-2 text-xs text-gray-500">(You)</span>}
            </p>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
      <td className="px-5 py-4"><StatusBadge active={user.is_active} /></td>
      <td className="px-5 py-4 text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
      <td className="px-5 py-4">
        {!isSelf && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-8 z-20 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => { onRoleChange(user, user.role === 'admin' ? 'student' : 'admin'); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      {user.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                    </button>
                    <button
                      onClick={() => { onToggleActive(user); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {user.is_active ? 'Suspend Account' : 'Activate Account'}
                    </button>
                    <div className="border-t border-gray-700" />
                    <button
                      onClick={() => { onDelete(user); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const LIMIT = 15

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getUsers({ page, limit: LIMIT })
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      /* error handled globally */
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleToggleActive = (user) => {
    setConfirm({
      title: user.is_active ? 'Suspend Account' : 'Activate Account',
      message: user.is_active
        ? `Suspend ${user.name}'s account? They will not be able to log in.`
        : `Activate ${user.name}'s account?`,
      danger: user.is_active,
      action: async () => {
        await adminAPI.updateUser(user.id, { is_active: !user.is_active })
        toast.success(user.is_active ? `${user.name} suspended` : `${user.name} activated`)
        fetchUsers()
      },
    })
  }

  const handleDelete = (user) => {
    setConfirm({
      title: 'Delete User',
      message: `Permanently delete ${user.name}'s account? This cannot be undone.`,
      danger: true,
      action: async () => {
        await adminAPI.deleteUser(user.id)
        toast.success(`${user.name} deleted`)
        fetchUsers()
      },
    })
  }

  const handleRoleChange = (user, newRole) => {
    setConfirm({
      title: newRole === 'admin' ? 'Promote to Admin' : 'Demote to Student',
      message: `Change ${user.name}'s role to ${newRole}?`,
      danger: false,
      action: async () => {
        await adminAPI.updateUser(user.id, { role: newRole })
        toast.success(`${user.name} is now a ${newRole}`)
        fetchUsers()
      },
    })
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">{total} registered users</p>
        </div>
        <button onClick={fetchUsers} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input-field pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                roleFilter === r
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-gray-800'
              }`}
            >
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400 font-medium">No users found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/60">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    currentUserId={currentUser?.id}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onRoleChange={handleRoleChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800/60">
            <p className="text-gray-500 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={async () => {
          await confirm.action()
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
