import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Layers, MessageSquare, Brain, TrendingUp, Calendar,
  Upload, Flame, Target, Clock, CheckCircle, AlertTriangle,
  Sparkles, ArrowRight, Plus, Zap, BarChart2
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, quizAPI, resourceAPI } from '../services/api'
import { DemoModeBanner, PageLoader, StatCard, ProgressBar, EmptyState } from '../components/ui/index.jsx'

const QUICK_ACTIONS = [
  { label: 'Upload Material', icon: Upload, to: '/study-generator', color: 'from-indigo-500 to-blue-600', desc: 'PDF, DOCX, Images' },
  { label: 'Take a Quiz', icon: MessageSquare, to: '/quiz', color: 'from-violet-500 to-purple-600', desc: 'Test your knowledge' },
  { label: 'AI Tutor', icon: Brain, to: '/tutor', color: 'from-cyan-500 to-teal-600', desc: 'Ask questions' },
  { label: 'Study Plan', icon: Calendar, to: '/planner', color: 'from-emerald-500 to-green-600', desc: 'Build schedule' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

const FALLBACK_WEEKLY = [
  { day: 'Mon', hours: 0 }, { day: 'Tue', hours: 0 }, { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 }, { day: 'Fri', hours: 0 }, { day: 'Sat', hours: 0 }, { day: 'Sun', hours: 0 },
]

function NextBestAction({ stats, recommendations, recentQuizzes }) {
  // Determine the best next action based on real data
  let action = null

  if (!stats || (stats.total_quizzes === 0 && stats.total_resources === 0)) {
    action = {
      icon: Upload,
      color: 'from-indigo-500 to-blue-600',
      title: 'Upload your first study material',
      desc: 'Get started by uploading a PDF, DOCX, or image. IBM Granite will extract topics and generate study content.',
      to: '/study-generator',
      cta: 'Upload Now',
    }
  } else if (stats.total_resources > 0 && stats.total_quizzes === 0) {
    action = {
      icon: MessageSquare,
      color: 'from-violet-500 to-purple-600',
      title: 'Take your first quiz',
      desc: `You have ${stats.total_resources} material${stats.total_resources !== 1 ? 's' : ''} uploaded. Test your knowledge with an AI-generated quiz.`,
      to: '/quiz',
      cta: 'Start Quiz',
    }
  } else if (recommendations?.length > 0 && recommendations[0]?.severity === 'warning') {
    const rec = recommendations[0]
    action = {
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      title: `Improve your ${rec.subject} score`,
      desc: rec.message,
      to: '/quiz',
      cta: 'Practice Now',
    }
  } else if (stats.study_streak === 0) {
    action = {
      icon: Flame,
      color: 'from-orange-500 to-red-600',
      title: 'Start your study streak today',
      desc: 'You haven\'t studied today. Even 10 minutes of practice keeps your knowledge fresh.',
      to: '/study-generator',
      cta: 'Study Now',
    }
  } else {
    action = {
      icon: TrendingUp,
      color: 'from-emerald-500 to-green-600',
      title: 'Keep up the great work!',
      desc: `${stats.study_streak} day streak! Try a harder quiz or explore your analytics to find opportunities to improve.`,
      to: '/analytics',
      cta: 'View Analytics',
    }
  }

  const ActionIcon = action.icon
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <div className="relative overflow-hidden card p-5 border border-indigo-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-violet-600/3 to-transparent pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md flex-shrink-0`}>
            <ActionIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Your Next Best Action</span>
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">{action.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{action.desc}</p>
          </div>
          <Link
            to={action.to}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
          >
            {action.cta} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function SubjectProgressBars({ analyticsData }) {
  const subjects = analyticsData?.subject_scores
    ? Object.entries(analyticsData.subject_scores).slice(0, 5)
    : null

  if (!subjects || subjects.length === 0) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Subject Performance</h2>
        <Link to="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300">Full analytics →</Link>
      </div>
      <div className="space-y-3">
        {subjects.map(([subject, score]) => (
          <div key={subject}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-300 text-xs font-medium">{subject}</span>
              <span className={`text-xs font-semibold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {score}%
              </span>
            </div>
            <ProgressBar
              value={score}
              max={100}
              color={score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [recentQuizzes, setRecentQuizzes] = useState([])
  const [recentResources, setRecentResources] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [statsData, activityData, recsData, quizHistory, resources] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getActivity(),
        dashboardAPI.getRecommendations(),
        quizAPI.history(),
        resourceAPI.list(),
      ])

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value)
        setDemoMode(statsData.value.demo_mode)
      }
      if (activityData.status === 'fulfilled') setActivity(activityData.value)
      if (recsData.status === 'fulfilled') {
        setRecommendations(recsData.value?.recommendations || [])
        // Build simple subject scores from recommendations
        if (recsData.value?.avg_scores) {
          setAnalyticsData({ subject_scores: recsData.value.avg_scores })
        }
      }
      if (quizHistory.status === 'fulfilled') setRecentQuizzes(quizHistory.value.slice(0, 4))
      if (resources.status === 'fulfilled') setRecentResources(resources.value.slice(0, 3))
    } catch {
      // silent — individual errors handled per section
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Study Hours',
      value: stats ? `${stats.study_hours_this_week}h` : '—',
      sub: 'This week',
      icon: Clock,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15',
    },
    {
      label: 'Topics Completed',
      value: stats ? String(stats.topics_completed) : '—',
      sub: 'Across all subjects',
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
    },
    {
      label: 'Avg Quiz Score',
      value: stats ? `${stats.avg_quiz_score}%` : '—',
      sub: stats?.avg_score_change != null
        ? (stats.avg_score_change >= 0 ? `+${stats.avg_score_change}% vs last week` : `${stats.avg_score_change}% vs last week`)
        : 'Take quizzes to track',
      icon: Target,
      color: 'text-violet-400',
      bg: 'bg-violet-500/15',
    },
    {
      label: 'Study Streak',
      value: stats ? `${stats.study_streak} day${stats.study_streak !== 1 ? 's' : ''}` : '—',
      sub: stats?.study_streak > 0 ? 'Keep it going! 🔥' : 'Start today!',
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
    },
  ]

  const weeklyData = activity?.weekly || FALLBACK_WEEKLY

  const hasQuizHistory = recentQuizzes.length > 0
  const quizChartData = hasQuizHistory
    ? recentQuizzes.map((q) => ({ subject: q.quiz_subject?.slice(0, 5) || 'Quiz', score: q.score }))
    : [{ subject: 'DSA', score: 0 }, { subject: 'DBMS', score: 0 }, { subject: 'CN', score: 0 }]

  const recs = recommendations || []

  if (loading) return <PageLoader text="Loading your dashboard..." />

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Demo notice when no real data */}
      {(stats?.total_quizzes === 0 && stats?.total_resources === 0) && (
        <DemoModeBanner message="No activity yet — start by uploading a study material or taking a quiz." />
      )}

      {/* Welcome + CTA */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="relative overflow-hidden card p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-violet-600/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                {stats?.total_quizzes === 0
                  ? "Let's start your learning journey today!"
                  : `You've completed ${stats?.total_quizzes || 0} quiz${stats?.total_quizzes !== 1 ? 'zes' : ''} and uploaded ${stats?.total_resources || 0} resource${stats?.total_resources !== 1 ? 's' : ''}.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/study-generator" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4 whitespace-nowrap">
                <Plus className="w-4 h-4" />
                Upload Material
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Best Action */}
      <NextBestAction stats={stats} recommendations={recs} recentQuizzes={recentQuizzes} />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
            <StatCard {...s} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="card-hover p-4 flex flex-col items-center gap-3 text-center group"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-200 text-sm font-medium">{action.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly activity */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Weekly Study Activity</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-lg">
                {weeklyData.reduce((s, d) => s + (d.hours || 0), 0).toFixed(1)}h total
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.75rem' }}
                  labelStyle={{ color: '#f9fafb' }}
                  itemStyle={{ color: '#a5b4fc' }}
                />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="#6366f1" strokeWidth={2} fill="url(#hoursGrad)" dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quiz scores */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Recent Quiz Scores</h2>
              {hasQuizHistory && (
                <Link to="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
              )}
            </div>
            {hasQuizHistory ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={quizChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="subject" type="category" stroke="#6b7280" tick={{ fontSize: 11 }} width={36} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(v) => [`${v}%`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart2}
                title="No quiz history"
                description="Take a quiz to see your subject-wise scores here."
                action={
                  <Link to="/quiz" className="btn-primary text-xs py-2 px-4">Start Quiz</Link>
                }
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Subject progress + recommendations */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Subject progress bars */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          {analyticsData?.subject_scores && Object.keys(analyticsData.subject_scores).length > 0 ? (
            <SubjectProgressBars analyticsData={analyticsData} />
          ) : (
            <div className="card p-5">
              <EmptyState
                icon={BarChart2}
                title="No subject data yet"
                description="Complete quizzes to see subject-wise performance tracking."
                action={
                  <Link to="/quiz" className="btn-primary text-xs py-2 px-4">Take a Quiz</Link>
                }
              />
            </div>
          )}
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-white font-semibold">AI Recommendations</h2>
              {recs.length > 0 && (
                <span className="ml-auto text-xs bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full">
                  {recs.length}
                </span>
              )}
            </div>
            {recs.length > 0 ? (
              <div className="space-y-3">
                {recs.slice(0, 3).map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border ${
                      rec.severity === 'warning' ? 'bg-amber-500/8 border-amber-500/20' :
                      rec.severity === 'success' ? 'bg-emerald-500/8 border-emerald-500/20' :
                      'bg-blue-500/8 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {rec.severity === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : rec.severity === 'success' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className={`text-xs font-semibold ${
                        rec.severity === 'warning' ? 'text-amber-400' :
                        rec.severity === 'success' ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {rec.subject}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{rec.message}</p>
                    {rec.severity === 'warning' && (
                      <Link to="/quiz" className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                        Start Practice Quiz <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No recommendations yet"
                description="Complete a few quizzes to get personalised AI recommendations."
                action={
                  <Link to="/quiz" className="btn-ghost text-xs py-2 px-4">Take a Quiz</Link>
                }
              />
            )}
            {recs.length > 0 && (
              <Link to="/analytics" className="mt-4 btn-ghost text-xs py-2 w-full flex items-center justify-center gap-1.5">
                View Full Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom row: recent resources */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent resources */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Study Materials</h2>
              <Link to="/study-generator" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            {recentResources.length > 0 ? (
              <div className="space-y-3">
                {recentResources.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-200 text-sm truncate">{r.original_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs capitalize ${r.status === 'completed' ? 'text-emerald-400' : r.status === 'processing' ? 'text-indigo-400' : 'text-gray-500'}`}>
                          {r.status}
                        </span>
                        <span className="text-gray-600 text-xs uppercase">{r.file_type}</span>
                      </div>
                    </div>
                    <Link to="/study-generator" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Upload}
                title="No materials uploaded"
                description="Upload a PDF, DOCX, or image to get started."
                action={
                  <Link to="/study-generator" className="btn-primary text-xs py-2 px-4">Upload Now</Link>
                }
              />
            )}
          </div>
        </motion.div>

        {/* Recent quiz history */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Quiz History</h2>
              <Link to="/quiz" className="text-xs text-indigo-400 hover:text-indigo-300">New Quiz →</Link>
            </div>
            {recentQuizzes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {recentQuizzes.map((q) => {
                  const scoreColor = q.score >= 80 ? 'text-emerald-400' : q.score >= 60 ? 'text-amber-400' : 'text-red-400'
                  return (
                    <div key={q.id} className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/60 hover:border-indigo-500/30 transition-all">
                      <p className="text-gray-200 text-sm font-medium truncate">{q.quiz_subject}</p>
                      {q.quiz_topic && <p className="text-gray-500 text-xs truncate">{q.quiz_topic}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-lg font-display font-bold ${scoreColor}`}>{q.score}%</span>
                        <span className="text-gray-600 text-xs">{q.total_questions}Q</span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={q.score} max={100} color={q.score >= 80 ? 'bg-emerald-500' : q.score >= 60 ? 'bg-amber-500' : 'bg-red-500'} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No quizzes taken"
                description="Take a quiz to track your progress."
                action={
                  <Link to="/quiz" className="btn-primary text-xs py-2 px-4">Start Quiz</Link>
                }
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
