import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('intellistudy_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred'
    if (err.response?.status === 401) {
      localStorage.removeItem('intellistudy_token')
      localStorage.removeItem('intellistudy_user')
      window.location.href = '/login'
    } else if (err.response?.status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },
  resetPassword: async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  changePassword: async (current_password, new_password) => {
    const { data } = await api.put('/auth/change-password', { current_password, new_password })
    return data
  },
  updateProfile: async (payload) => {
    const { data } = await api.patch('/auth/profile', payload)
    return data
  },
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: async () => {
    const { data } = await api.get('/dashboard/stats')
    return data
  },
  getActivity: async () => {
    const { data } = await api.get('/dashboard/activity')
    return data
  },
  getRecommendations: async () => {
    const { data } = await api.get('/dashboard/recommendations')
    return data
  },
}

// ─── Resources ─────────────────────────────────────────────────────────────
export const resourceAPI = {
  upload: async (formData, onProgress) => {
    const { data } = await api.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    })
    return data
  },
  list: async () => {
    const { data } = await api.get('/resources')
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/resources/${id}`)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/resources/${id}`)
    return data
  },
  generateStudyMaterial: async (resourceId, type) => {
    const { data } = await api.post(`/resources/${resourceId}/generate`, { type })
    return data
  },
}

// ─── Flashcards ────────────────────────────────────────────────────────────
export const flashcardAPI = {
  generate: async (resourceId, count = 10) => {
    const { data } = await api.post('/flashcards/generate', { resource_id: resourceId, count })
    return data
  },
  list: async () => {
    const { data } = await api.get('/flashcards')
    return data
  },
  getSet: async (setId) => {
    const { data } = await api.get(`/flashcards/${setId}`)
    return data
  },
  update: async (id, updates) => {
    const { data } = await api.patch(`/flashcards/${id}`, updates)
    return data
  },
}

// ─── Quizzes ───────────────────────────────────────────────────────────────
export const quizAPI = {
  generate: async (payload) => {
    const { data } = await api.post('/quiz/generate', payload)
    return data
  },
  submit: async (quizId, answers) => {
    const { data } = await api.post(`/quiz/${quizId}/submit`, { answers })
    return data
  },
  history: async () => {
    const { data } = await api.get('/quiz/history')
    return data
  },
}

// ─── Study Planner ─────────────────────────────────────────────────────────
export const plannerAPI = {
  create: async (payload) => {
    const { data } = await api.post('/planner/create', payload)
    return data
  },
  get: async () => {
    const { data } = await api.get('/planner')
    return data
  },
}

// ─── Tutor ─────────────────────────────────────────────────────────────────
export const tutorAPI = {
  chat: async (message, resourceId = null) => {
    const { data } = await api.post('/tutor/chat', { message, resource_id: resourceId })
    return data
  },
  history: async () => {
    const { data } = await api.get('/tutor/history')
    return data
  },
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  get: async () => {
    const { data } = await api.get('/analytics')
    return data
  },
}

// ─── Agent Orchestration ───────────────────────────────────────────────────
export const agentAPI = {
  orchestrate: async (payload) => {
    const { data } = await api.post('/agent/orchestrate', payload)
    return data
  },
  status: async () => {
    const { data } = await api.get('/agent/status')
    return data
  },
}

// ─── Admin ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: async () => {
    const { data } = await api.get('/admin/stats')
    return data
  },
  getUsers: async (params) => {
    const { data } = await api.get('/admin/users', { params })
    return data
  },
  updateUser: async (id, updates) => {
    const { data } = await api.patch(`/admin/users/${id}`, updates)
    return data
  },
  deleteUser: async (id) => {
    const { data } = await api.delete(`/admin/users/${id}`)
    return data
  },
}

export default api
