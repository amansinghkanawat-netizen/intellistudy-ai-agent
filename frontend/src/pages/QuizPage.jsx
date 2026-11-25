import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Timer, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Trophy, Sparkles, RotateCcw, Send, Loader, Clock,
  BookOpen, AlertTriangle, Zap, ArrowRight, Flag, Eye
} from 'lucide-react'
import { quizAPI, resourceAPI } from '../services/api'
import { PageHeader, DemoModeBanner, ProgressBar, EmptyState } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'

const SUBJECTS = ['Data Structures', 'DBMS', 'Computer Networks', 'Operating Systems', 'Machine Learning', 'Software Engineering', 'Theory of Computation']
const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { id: 'medium', label: 'Medium', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { id: 'hard', label: 'Hard', color: 'text-red-400 border-red-500/40 bg-red-500/10' },
]

function useTimer(initialSeconds, running) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const startRef = useRef(initialSeconds)
  useEffect(() => {
    startRef.current = initialSeconds
    setSeconds(initialSeconds)
  }, [initialSeconds])
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])
  const reset = (s) => { setSeconds(s); startRef.current = s }
  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const elapsed = startRef.current - seconds
  return { seconds, fmt, reset, elapsed }
}

export default function QuizPage() {
  const [phase, setPhase] = useState('setup')
  const [config, setConfig] = useState({ subject: 'Data Structures', difficulty: 'medium', numQuestions: 5, resourceId: null })
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [quizData, setQuizData] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [marked, setMarked] = useState(new Set()) // mark for review
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [timeTaken, setTimeTaken] = useState(0)
  const timer = useTimer(config.numQuestions * 60, phase === 'quiz')

  useEffect(() => {
    resourceAPI.list()
      .then((data) => setResources(data.filter((r) => r.status === 'completed')))
      .catch(() => {})
    quizAPI.history()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    if (phase === 'quiz' && timer.seconds === 0) {
      toast.error('Time is up! Auto-submitting...')
      handleSubmit()
    }
  }, [timer.seconds, phase])

  useEffect(() => {
    if (phase !== 'quiz' || !quizData) return
    const handler = (e) => {
      const q = quizData.questions[currentQ]
      if (!q) return
      const opts = q.options || []
      if (e.key >= '1' && e.key <= String(opts.length)) {
        setAnswers((prev) => ({ ...prev, [q.id]: Number(e.key) - 1 }))
      }
      if (e.key === 'ArrowRight' && currentQ < quizData.questions.length - 1) setCurrentQ((c) => c + 1)
      if (e.key === 'ArrowLeft' && currentQ > 0) setCurrentQ((c) => c - 1)
      if (e.key === 'm' || e.key === 'M') {
        setMarked((prev) => {
          const n = new Set(prev)
          if (n.has(q.id)) n.delete(q.id)
          else n.add(q.id)
          return n
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, currentQ, quizData])

  const startQuiz = async () => {
    setLoading(true)
    try {
      const data = await quizAPI.generate({
        subject: config.subject,
        difficulty: config.difficulty,
        num_questions: config.numQuestions,
        resource_id: config.resourceId || undefined,
      })
      setQuizData(data)
      setDemoMode(data.demo_mode)
      setAnswers({})
      setMarked(new Set())
      setCurrentQ(0)
      setResult(null)
      timer.reset(config.numQuestions * 60)
      setPhase('quiz')
    } catch {
      // handled globally
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!quizData || submitting) return
    setTimeTaken(timer.elapsed)
    setSubmitting(true)
    try {
      const apiAnswers = {}
      quizData.questions.forEach((q) => {
        if (answers[q.id] !== undefined) apiAnswers[q.id] = answers[q.id]
      })
      const data = await quizAPI.submit(quizData.quiz_id, apiAnswers)
      setResult(data)
      setPhase('results')
      quizAPI.history().then(setHistory).catch(() => {})
    } catch {
      // handled globally
    } finally {
      setSubmitting(false)
    }
  }, [quizData, answers, submitting, timer.elapsed])

  if (phase === 'setup') return (
    <QuizSetup
      config={config}
      setConfig={setConfig}
      onStart={startQuiz}
      loading={loading}
      resources={resources}
      history={history}
      historyLoading={historyLoading}
    />
  )

  if (phase === 'results') return (
    <QuizResults
      result={result}
      quizData={quizData}
      answers={answers}
      timeTaken={timeTaken}
      onRetry={() => setPhase('setup')}
      demoMode={demoMode}
    />
  )

  if (!quizData) return null
  const q = quizData.questions[currentQ]
  const totalQ = quizData.questions.length
  const answered = Object.keys(answers).length
  const timerColor = timer.seconds < 60 ? 'text-red-400' : timer.seconds < 120 ? 'text-amber-400' : 'text-emerald-400'
  const isMarked = q && marked.has(q.id)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white">{quizData.subject}</h1>
          <p className="text-gray-400 text-sm">{totalQ} questions · {quizData.difficulty}</p>
        </div>
        <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
          <Clock className="w-5 h-5" />
          {timer.fmt}
        </div>
      </div>

      {demoMode && <DemoModeBanner message="Demo quiz — real questions generated from your uploaded materials with IBM Granite." />}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Question {currentQ + 1} of {totalQ}</span>
          <span>{answered} answered · {marked.size} flagged</span>
        </div>
        <ProgressBar value={currentQ + 1} max={totalQ} />
      </div>

      {/* Question sidebar dots */}
      <div className="flex gap-1.5 flex-wrap">
        {quizData.questions.map((qItem, i) => {
          const isAnswered = answers[qItem.id] !== undefined
          const isReviewing = marked.has(qItem.id)
          return (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              title={isReviewing ? 'Marked for review' : isAnswered ? 'Answered' : 'Unanswered'}
              className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
                i === currentQ ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-400' :
                isReviewing ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                isAnswered ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-500/60" />Current</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/30" />Answered</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/15 border border-amber-500/30" />Flagged</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-800 border border-gray-700" />Not answered</span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="card p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="badge bg-gray-800 text-gray-400 text-xs">Q{currentQ + 1}</span>
            <span className="badge bg-gray-800 text-gray-400 text-xs uppercase">{q?.question_type || 'mcq'}</span>
            {isMarked && (
              <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs flex items-center gap-1">
                <Flag className="w-3 h-3" />Flagged
              </span>
            )}
            <span className="ml-auto text-gray-600 text-xs">Press 1-{q?.options?.length} to select · M to flag</span>
          </div>
          <p className="text-white text-lg font-medium mb-6 leading-relaxed">{q?.question_text}</p>
          <div className="space-y-2.5">
            {(q?.options || []).map((opt, i) => {
              const selected = answers[q.id] === i
              return (
                <motion.button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-indigo-500/60 bg-indigo-500/15 text-white shadow-glow'
                      : 'border-gray-800 hover:border-gray-600 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    selected ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm">{opt}</span>
                  {selected && <CheckCircle className="w-4 h-4 text-indigo-400 ml-auto flex-shrink-0" />}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentQ((c) => c - 1)}
          disabled={currentQ === 0}
          className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {/* Mark for review button */}
        <button
          onClick={() => {
            if (!q) return
            setMarked((prev) => {
              const n = new Set(prev)
              if (n.has(q.id)) n.delete(q.id)
              else n.add(q.id)
              return n
            })
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            isMarked
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'border-gray-700 text-gray-400 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <Flag className="w-4 h-4" />
          {isMarked ? 'Flagged' : 'Flag'}
        </button>

        {currentQ < totalQ - 1 ? (
          <button
            onClick={() => setCurrentQ((c) => c + 1)}
            className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Setup ─────────────────────────────────────────────────────────────────
function QuizSetup({ config, setConfig, onStart, loading, resources, history, historyLoading }) {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Quiz Generator"
        description="Configure your quiz and test your knowledge with AI-generated questions."
        badge={resources.length > 0 ? 'Resources Available' : undefined}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-5">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide text-gray-400">Configure Quiz</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <select
              value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              className="input-field"
            >
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {resources.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Generate from material <span className="text-indigo-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setConfig({ ...config, resourceId: null })}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!config.resourceId ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                >
                  General
                </button>
                {resources.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setConfig({ ...config, resourceId: r.id })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all truncate max-w-40 ${config.resourceId === r.id ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                  >
                    {r.original_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setConfig({ ...config, difficulty: d.id })}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    config.difficulty === d.id ? d.color : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Questions: <span className="text-indigo-400 font-bold">{config.numQuestions}</span>
              <span className="text-gray-500 ml-2 text-xs">≈ {config.numQuestions} min</span>
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={config.numQuestions}
              onChange={(e) => setConfig({ ...config, numQuestions: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-2"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>3</span><span>8</span><span>15</span>
            </div>
          </div>

          <button
            onClick={onStart}
            disabled={loading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base"
          >
            {loading ? <><Loader className="w-4 h-4 animate-spin" />Generating Quiz...</> : <><Sparkles className="w-4 h-4" />Start Quiz</>}
          </button>
          <p className="text-gray-600 text-xs text-center">Keyboard: 1-4 answer · Arrow keys navigate · M to flag question</p>
        </div>

        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Recent Attempts</h3>
          {historyLoading ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : history.length > 0 ? (
            <div className="space-y-2">
              {history.slice(0, 6).map((h) => {
                const score = h.score
                const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                return (
                  <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-all">
                    <div className="min-w-0">
                      <p className="text-gray-200 text-xs font-medium truncate">{h.quiz_subject}</p>
                      <p className="text-gray-600 text-xs">{h.total_questions}Q</p>
                    </div>
                    <span className={`font-bold text-sm ${color}`}>{score}%</span>
                  </div>
                )
              })}
              <Link to="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                View all analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="No attempts yet" description="Complete your first quiz to see history." />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Results ───────────────────────────────────────────────────────────────
function QuizResults({ result, quizData, answers, timeTaken, onRetry, demoMode }) {
  const [showReview, setShowReview] = useState(false)
  if (!result) return null

  const { score, correct, total, results, agent_response } = result
  const grade = score >= 90 ? 'Excellent!' : score >= 75 ? 'Great work!' : score >= 60 ? 'Good effort' : 'Keep practicing'
  const gradeColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  const gradeBg = score >= 80 ? 'from-emerald-500/20 to-emerald-500/5' : score >= 60 ? 'from-amber-500/20 to-amber-500/5' : 'from-red-500/20 to-red-500/5'

  // Compute topic-wise breakdown
  const correctCount = (results || []).filter(r => r.is_correct).length
  const incorrectCount = (results || []).filter(r => !r.is_correct).length
  const unansweredCount = (results || []).filter(r => r.user_answer === undefined || r.user_answer === null).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const timeFmt = timeTaken > 0
    ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`
    : '—'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Quiz Results" />

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`card p-8 text-center bg-gradient-to-b ${gradeBg}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          className="inline-block"
        >
          <div className={`text-7xl font-display font-black ${gradeColor} mb-2`}>{score}%</div>
        </motion.div>
        <p className={`text-xl font-semibold ${gradeColor} mb-1`}>{grade}</p>
        <p className="text-gray-400 text-sm">{correct} out of {total} correct</p>
        <div className="mt-5 max-w-xs mx-auto">
          <ProgressBar value={score} max={100} color={score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'} />
        </div>
      </motion.div>

      {/* Result dashboard: stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-red-400', bg: 'bg-gray-800/40' },
          { label: 'Time Taken', value: timeFmt, color: 'text-indigo-400', bg: 'bg-gray-800/40' },
          { label: 'Correct', value: correctCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Incorrect', value: incorrectCount + unansweredCount, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((s) => (
          <div key={s.label} className={`p-3 rounded-xl ${s.bg} text-center`}>
            <div className={`text-xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Topic breakdown */}
      {(results || []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-3">Question Breakdown</h3>
          <div className="grid grid-cols-10 gap-1">
            {(results || []).map((r, i) => (
              <div
                key={i}
                title={`Q${i + 1}: ${r.is_correct ? 'Correct' : r.user_answer == null ? 'Unanswered' : 'Incorrect'}`}
                className={`h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                  r.is_correct ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  r.user_answer == null ? 'bg-gray-800 text-gray-600 border border-gray-700' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30" />Correct</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30" />Wrong</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-800 border border-gray-700" />Skipped</span>
          </div>
        </motion.div>
      )}

      {/* Agent response (if score was low) */}
      {agent_response && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5 border border-indigo-500/25 bg-indigo-500/5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-semibold text-sm">AI Multi-Agent Response</h3>
            {agent_response.demo_mode && <span className="badge bg-amber-500/20 text-amber-400 text-xs">DEMO</span>}
          </div>
          <p className="text-indigo-300 text-xs mb-3">{agent_response.triggered_by}</p>
          <div className="p-3 rounded-xl bg-gray-800/50 mb-3">
            <p className="text-gray-300 text-xs font-medium mb-1">Tutor Explanation:</p>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{agent_response.tutor_explanation}</p>
          </div>
          <p className="text-amber-400 text-xs">{agent_response.recommendation}</p>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
          <RotateCcw className="w-4 h-4" /> New Quiz
        </button>
        <button
          onClick={() => setShowReview(!showReview)}
          className={showReview ? 'btn-secondary flex-1 py-3 flex items-center justify-center gap-2' : 'btn-primary flex-1 py-3 flex items-center justify-center gap-2'}
        >
          <Eye className="w-4 h-4" />
          {showReview ? 'Hide Review' : 'Review Answers'}
        </button>
      </div>

      {/* Answer review */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {(results || []).map((r, i) => (
              <div key={i} className={`card p-4 border ${r.is_correct ? 'border-emerald-500/25' : 'border-red-500/25'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {r.is_correct ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                  <p className="text-white text-sm font-medium">{r.question_text}</p>
                </div>
                <div className="ml-6 space-y-0.5">
                  {!r.is_correct && (
                    <p className="text-red-400 text-xs">Your answer: {r.user_answer !== undefined && r.user_answer !== null ? r.options?.[r.user_answer] : 'Not answered'}</p>
                  )}
                  <p className="text-emerald-400 text-xs">Correct: {r.options?.[r.correct_answer]}</p>
                  {r.explanation && <p className="text-gray-400 text-xs mt-1 italic">{r.explanation}</p>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
