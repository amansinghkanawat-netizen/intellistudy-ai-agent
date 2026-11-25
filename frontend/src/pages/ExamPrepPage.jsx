import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar, Target, BookOpen, MessageSquare, Sparkles, Plus, Loader,
  CheckCircle, AlertTriangle, Clock, TrendingUp, ArrowRight, Trash2, Flag
} from 'lucide-react'
import { quizAPI, analyticsAPI } from '../services/api'
import { ProgressBar, EmptyState } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'

const SUBJECTS = [
  'Data Structures', 'DBMS', 'Computer Networks', 'Operating Systems',
  'Machine Learning', 'Software Engineering', 'Theory of Computation',
  'Mathematics', 'Physics', 'Chemistry'
]

const DIFFICULTIES = ['easy', 'medium', 'hard']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function ExamPrepPage() {
  const [exams, setExams] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('intellistudy_exams') || '[]')
    } catch { return [] }
  })
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ subject: 'Data Structures', date: '', difficulty: 'medium' })
  const [practiceSubject, setPracticeSubject] = useState(SUBJECTS[0])
  const [practiceDifficulty, setPracticeDifficulty] = useState('medium')
  const [generating, setGenerating] = useState(false)
  const [practiceResult, setPracticeResult] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    quizAPI.history()
      .then(setHistory)
      .catch(() => {})
    analyticsAPI.get()
      .then(setAnalyticsData)
      .catch(() => {})
  }, [])

  const saveExams = (updated) => {
    setExams(updated)
    localStorage.setItem('intellistudy_exams', JSON.stringify(updated))
  }

  const addExam = () => {
    if (!form.date) return toast.error('Please select an exam date.')
    if (!form.subject) return toast.error('Please select a subject.')
    const days = daysUntil(form.date)
    if (days !== null && days < 0) return toast.error('Exam date must be in the future.')
    const updated = [...exams, { ...form, id: Date.now().toString() }]
    saveExams(updated)
    setShowAdd(false)
    setForm({ subject: 'Data Structures', date: '', difficulty: 'medium' })
    toast.success('Exam added!')
  }

  const removeExam = (id) => {
    saveExams(exams.filter(e => e.id !== id))
  }

  const startPractice = async () => {
    setGenerating(true)
    setPracticeResult(null)
    try {
      const data = await quizAPI.generate({
        subject: practiceSubject,
        difficulty: practiceDifficulty,
        num_questions: 5,
      })
      setPracticeResult(data)
      toast.success('Practice quiz generated!')
    } catch {
      // handled globally
    } finally {
      setGenerating(false)
    }
  }

  // Compute subject progress from history
  const subjectProgress = {}
  history.forEach((h) => {
    if (!subjectProgress[h.quiz_subject]) subjectProgress[h.quiz_subject] = { total: 0, sum: 0, count: 0 }
    subjectProgress[h.quiz_subject].sum += h.score
    subjectProgress[h.quiz_subject].count += 1
    subjectProgress[h.quiz_subject].total = h.total_questions
  })

  const weakSubjects = Object.entries(subjectProgress)
    .filter(([, v]) => v.count > 0 && (v.sum / v.count) < 70)
    .sort((a, b) => (a[1].sum / a[1].count) - (b[1].sum / b[1].count))
    .slice(0, 3)

  const readiness = analyticsData?.exam_readiness

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">Exam Prep Center</h1>
          <p className="text-gray-400 text-sm">Track your exams, practice weak topics, and monitor preparation progress.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Exam
        </button>
      </div>

      {/* Exam Readiness banner */}
      {readiness && (
        <div className={`card p-5 flex items-center gap-4 border ${
          readiness.readiness_label === 'High' ? 'border-emerald-500/30' :
          readiness.readiness_label === 'Medium' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0 ${
            readiness.readiness_label === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
            readiness.readiness_label === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {readiness.readiness_score}%
          </div>
          <div>
            <p className="text-white font-semibold">Overall Readiness: {readiness.readiness_label}</p>
            <p className="text-gray-400 text-xs mt-1">{readiness.disclaimer}</p>
          </div>
          <Link to="/analytics" className="ml-auto btn-ghost text-xs py-2 px-3 flex-shrink-0 hidden sm:flex items-center gap-1">
            Full Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Upcoming Exams
              </h2>
            </div>

            {exams.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No exams scheduled"
                description="Add your exam dates to track preparation and generate topic-wise practice."
                action={
                  <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Exam
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {exams
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((exam) => {
                    const days = daysUntil(exam.date)
                    const subj = subjectProgress[exam.subject]
                    const avg = subj && subj.count > 0 ? Math.round(subj.sum / subj.count) : null
                    const urgency = days !== null && days <= 7 ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      days !== null && days <= 14 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    return (
                      <div key={exam.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-800/40 border border-gray-700/60 hover:border-indigo-500/30 transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium text-sm">{exam.subject}</p>
                            <span className={`badge border text-xs ${urgency}`}>
                              {days === null ? 'Date set' : days === 0 ? 'Today!' : days < 0 ? 'Past' : `${days}d left`}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · {exam.difficulty}
                          </p>
                          {avg !== null && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                <span>Practice score</span>
                                <span className={avg >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{avg}%</span>
                              </div>
                              <ProgressBar value={avg} max={100} color={avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-indigo-500' : 'bg-amber-500'} />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeExam(exam.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                          title="Remove exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Weak topics to focus on */}
          {weakSubjects.length > 0 && (
            <div className="card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Focus Areas
              </h3>
              <div className="space-y-3">
                {weakSubjects.map(([subject, data]) => {
                  const avg = Math.round(data.sum / data.count)
                  return (
                    <div key={subject}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-gray-200 text-sm">{subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-xs font-semibold">{avg}% avg</span>
                          <button
                            onClick={() => { setPracticeSubject(subject); setPracticeDifficulty('easy') }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-lg"
                          >
                            Practice
                          </button>
                        </div>
                      </div>
                      <ProgressBar value={avg} max={100} color="bg-amber-500" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Practice Generator */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Topic-wise Practice
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <select
                  value={practiceSubject}
                  onChange={(e) => setPracticeSubject(e.target.value)}
                  className="input-field"
                >
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setPracticeDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                        practiceDifficulty === d
                          ? d === 'easy' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : d === 'medium' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                            : 'bg-red-500/15 border-red-500/40 text-red-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startPractice}
                disabled={generating}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {generating
                  ? <><Loader className="w-4 h-4 animate-spin" />Generating...</>
                  : <><Sparkles className="w-4 h-4" />Generate Practice Quiz</>
                }
              </button>
            </div>

            {/* Practice preview */}
            {practiceResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{practiceResult.subject}</p>
                    <p className="text-gray-400 text-xs">{practiceResult.questions?.length} questions · {practiceResult.difficulty}</p>
                  </div>
                  {practiceResult.demo_mode && (
                    <span className="badge bg-amber-500/20 text-amber-400 text-xs">DEMO</span>
                  )}
                </div>
                <p className="text-gray-300 text-xs mb-3">First question preview:</p>
                <div className="p-3 rounded-xl bg-gray-800/50">
                  <p className="text-white text-sm">{practiceResult.questions?.[0]?.question_text}</p>
                </div>
                <Link to="/quiz" className="mt-3 btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Go to Quiz to Take This Quiz
                </Link>
              </motion.div>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-5">
            <h3 className="text-white font-semibold mb-3">Study Resources</h3>
            <div className="space-y-2">
              {[
                { label: 'Full Quiz Mode', desc: 'Timed quiz with mark-for-review', to: '/quiz', icon: MessageSquare, color: 'text-violet-400' },
                { label: 'Flashcards', desc: 'Review and memorise key terms', to: '/flashcards', icon: BookOpen, color: 'text-cyan-400' },
                { label: 'AI Tutor', desc: 'Get detailed explanations', to: '/tutor', icon: Sparkles, color: 'text-emerald-400' },
                { label: 'Analytics', desc: 'Track performance trends', to: '/analytics', icon: TrendingUp, color: 'text-indigo-400' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-white/5 transition-all group"
                >
                  <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add exam modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-6 max-w-sm w-full"
            >
              <h3 className="text-white font-semibold text-lg mb-5">Add Exam</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="input-field"
                  >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exam Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setForm({ ...form, difficulty: d })}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                          form.difficulty === d
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={addExam} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Add Exam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
