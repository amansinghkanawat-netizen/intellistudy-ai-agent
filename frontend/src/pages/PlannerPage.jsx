import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Target, AlertTriangle, Sparkles, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECTS_LIST = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'History', 'Biology', 'Economics']

const DEMO_PLAN = [
  { day: 'Monday', date: 'Nov 25', sessions: [{ subject: 'Computer Science', topic: 'Data Structures — Trees', duration: '2h', priority: 'high' }, { subject: 'Mathematics', topic: 'Calculus revision', duration: '1h', priority: 'medium' }] },
  { day: 'Tuesday', date: 'Nov 26', sessions: [{ subject: 'Physics', topic: 'Electromagnetism', duration: '1.5h', priority: 'high' }, { subject: 'Computer Science', topic: 'Graphs & Algorithms', duration: '2h', priority: 'high' }] },
  { day: 'Wednesday', date: 'Nov 27', sessions: [{ subject: 'Chemistry', topic: 'Organic reactions', duration: '2h', priority: 'medium' }, { subject: 'Mathematics', topic: 'Practice problems', duration: '1.5h', priority: 'medium' }] },
  { day: 'Thursday', date: 'Nov 28', sessions: [{ subject: 'Computer Science', topic: 'Mock Test — DSA', duration: '2.5h', priority: 'high' }] },
  { day: 'Friday', date: 'Nov 29', sessions: [{ subject: 'English', topic: 'Essay writing practice', duration: '1h', priority: 'low' }, { subject: 'Physics', topic: 'Revision', duration: '1.5h', priority: 'medium' }] },
]

const PRIORITY_STYLES = {
  high: 'bg-red-500/20 border-red-500/40 text-red-400',
  medium: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
  low: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
}

export default function PlannerPage() {
  const [phase, setPhase] = useState('setup')
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState(null)
  const [form, setForm] = useState({
    subjects: [],
    examDate: '',
    dailyHours: '3',
    difficulty: 'Medium',
  })
  const [completed, setCompleted] = useState(new Set())

  const toggleSubject = (s) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(s) ? prev.subjects.filter((x) => x !== s) : [...prev.subjects, s],
    }))
  }

  const generate = async () => {
    if (form.subjects.length === 0) return toast.error('Select at least one subject.')
    if (!form.examDate) return toast.error('Please set your exam date.')
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 2000))
    setPlan(DEMO_PLAN)
    setPhase('plan')
    setGenerating(false)
    toast.success('Study plan generated! (Demo mode)')
  }

  if (phase === 'plan' && plan) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Your Study Plan</h1>
            <p className="text-gray-400 text-sm">AI-generated 7-day personalised schedule</p>
          </div>
          <button onClick={() => { setPhase('setup'); setPlan(null) }} className="btn-secondary text-sm py-2">
            Regenerate
          </button>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-xs"><strong>DEMO MODE</strong> — Sample plan. Real plans adapt to your performance.</p>
        </div>
        <div className="space-y-4">
          {DEMO_PLAN.map((day, di) => (
            <div key={di} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{day.day}</h3>
                  <p className="text-gray-500 text-xs">{day.date}</p>
                </div>
              </div>
              <div className="space-y-2">
                {day.sessions.map((s, si) => {
                  const key = `${di}-${si}`
                  const done = completed.has(key)
                  return (
                    <div key={si} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? 'opacity-50' : ''} bg-gray-800/40 border-gray-700/60`}>
                      <button
                        onClick={() => setCompleted((prev) => { const n = new Set(prev); done ? n.delete(key) : n.add(key); return n })}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-indigo-500'}`}
                      >
                        {done && <CheckCircle className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${done ? 'line-through text-gray-500' : 'text-white'}`}>{s.subject}</p>
                        <p className="text-gray-500 text-xs truncate">{s.topic}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock className="w-3 h-3" />
                          {s.duration}
                        </div>
                        <span className={`badge border text-xs ${PRIORITY_STYLES[s.priority]}`}>{s.priority}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">Smart Study Planner</h1>
        <p className="text-gray-400 text-sm">Generate a personalised AI study plan based on your exam schedule.</p>
      </div>
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-amber-300 text-xs"><strong>DEMO MODE</strong> — Sample plan generation.</p>
      </div>
      <div className="card p-6 space-y-6">
        {/* Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Select Subjects</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS_LIST.map((s) => {
              const sel = form.subjects.includes(s)
              return (
                <button key={s} onClick={() => toggleSubject(s)} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${sel ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>
        {/* Exam date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Exam Date</label>
          <input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} className="input-field" />
        </div>
        {/* Daily hours */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Daily Study Hours: {form.dailyHours}h</label>
          <input type="range" min={1} max={10} value={form.dailyHours} onChange={(e) => setForm({ ...form, dailyHours: e.target.value })} className="w-full accent-indigo-500" />
        </div>
        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Preparation Level</label>
          <div className="flex gap-2">
            {['Relaxed', 'Medium', 'Intensive'].map((d) => (
              <button key={d} onClick={() => setForm({ ...form, difficulty: d })} className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${form.difficulty === d ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={generating} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          {generating ? <><Loader className="w-4 h-4 animate-spin" />Generating Plan...</> : <><Sparkles className="w-4 h-4" />Generate Study Plan</>}
        </button>
      </div>
    </div>
  )
}
