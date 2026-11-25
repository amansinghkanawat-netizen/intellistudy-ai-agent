import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, Zap, Loader, ArrowRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell
} from 'recharts'
import { analyticsAPI } from '../services/api'
import { ProgressBar, SkeletonCard, SkeletonStatCard } from '../components/ui/index.jsx'

const DEMO_RADAR = [
  { subject: 'DSA', score: 91 }, { subject: 'DBMS', score: 88 }, { subject: 'OS', score: 72 },
  { subject: 'CN', score: 65 }, { subject: 'ML', score: 78 }, { subject: 'Maths', score: 83 },
]
const DEMO_TREND = [
  { week: 'W1', score: 62 }, { week: 'W2', score: 68 }, { week: 'W3', score: 71 },
  { week: 'W4', score: 75 }, { week: 'W5', score: 78 }, { week: 'W6', score: 82 },
  { week: 'W7', score: 79 }, { week: 'W8', score: 85 },
]

// Generate a 7x13 heatmap grid (7 days × 13 weeks)
function buildHeatmapGrid(weeklyData) {
  const grid = []
  for (let w = 0; w < 13; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const weekIdx = w - (13 - (weeklyData?.length || 0))
      const count = weekIdx >= 0 && weeklyData?.[weekIdx]?.count ? weeklyData[weekIdx].count : 0
      week.push(count)
    }
    grid.push(week)
  }
  return grid
}

function StudyHeatmap({ weeklyData }) {
  const grid = buildHeatmapGrid(weeklyData)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = new Date()
  const currentMonth = months[today.getMonth()]

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-800/80'
    if (count === 1) return 'bg-indigo-500/30'
    if (count === 2) return 'bg-indigo-500/55'
    return 'bg-indigo-500/85'
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" /> Study Activity Heatmap
        </h2>
        <span className="text-xs text-gray-500">Last 13 weeks</span>
      </div>
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mt-1 mr-1">
          {days.map((d, i) => (
            <div key={i} className="h-4 w-4 flex items-center justify-center text-gray-600 text-xs">{d}</div>
          ))}
        </div>
        {/* Heatmap grid */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((count, di) => (
                <div
                  key={di}
                  title={`${count} quizzes`}
                  className={`w-4 h-4 rounded-sm ${getColor(count)} transition-colors cursor-default`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-gray-600 text-xs">Less</span>
        {[0, 1, 2, 3].map((v) => (
          <div key={v} className={`w-4 h-4 rounded-sm ${getColor(v)}`} />
        ))}
        <span className="text-gray-600 text-xs">More</span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.get()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const hasRealData = data?.total_quizzes && data.total_quizzes > 0

  const radarData = data?.subject_scores && Object.keys(data.subject_scores).length > 0
    ? Object.entries(data.subject_scores).map(([subject, score]) => ({ subject, score }))
    : DEMO_RADAR

  const trendData = data?.weekly_trend?.filter((w) => w.score !== null).length > 0
    ? data.weekly_trend.filter((w) => w.score !== null)
    : DEMO_TREND

  const recommendations = data?.recommendations || [
    { subject: 'Complete quizzes', severity: 'info', message: 'Take quizzes to generate personalised analytics and recommendations.' },
  ]

  const readiness = data?.exam_readiness

  // Subject comparison bar chart data
  const subjectBarData = data?.subject_scores
    ? Object.entries(data.subject_scores).map(([subject, score]) => ({
        subject: subject.length > 6 ? subject.slice(0, 6) + '.' : subject,
        fullSubject: subject,
        score,
        fill: score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : '#f59e0b',
      }))
    : []

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-9 w-56 shimmer rounded-xl" />
        <div className="grid lg:grid-cols-2 gap-4">
          <SkeletonCard rows={6} />
          <SkeletonCard rows={6} />
        </div>
        <SkeletonCard rows={4} />
        <SkeletonCard rows={3} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Predictive Analytics</h1>
          <p className="text-gray-400 text-sm">AI-powered performance analysis based on your quiz history and study activity.</p>
        </div>
        <Link to="/exam-prep" className="btn-ghost text-sm py-2 px-4 flex items-center gap-2 whitespace-nowrap">
          Exam Prep <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!hasRealData && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-xs">Take some quizzes to generate real analytics. Sample data shown below.</p>
        </div>
      )}

      {/* Readiness banner */}
      {readiness && (
        <div className={`card p-5 flex items-center gap-4 ${
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
            <p className="text-white font-semibold">Exam Readiness: {readiness.readiness_label}</p>
            <p className="text-gray-400 text-xs mt-1">{readiness.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <StudyHeatmap weeklyData={data?.weekly_trend} />

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4">Subject Proficiency Radar</h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4">Score Trend (8 Weeks)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.75rem' }} labelStyle={{ color: '#f9fafb' }} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject performance comparison */}
      {subjectBarData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4">Subject Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="subject" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.75rem' }}
                labelStyle={{ color: '#f9fafb' }}
                formatter={(v, name, props) => [`${v}%`, props.payload.fullSubject || name]}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {subjectBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-end text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />≥80% (Strong)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" />60-79% (OK)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" />&lt;60% (Needs work)</span>
          </div>
        </div>
      )}

      {/* Subject scores progress bars */}
      {Object.keys(data?.subject_scores || {}).length > 0 && (
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4">Subject Performance</h2>
          <div className="space-y-4">
            {Object.entries(data.subject_scores).map(([subject, score]) => (
              <div key={subject}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-200 text-sm font-medium">{subject}</span>
                  <span className="text-gray-400 text-xs">{score}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalised Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <h2 className="text-white font-semibold">Personalised Recommendations</h2>
          {hasRealData && (
            <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
              Data-driven
            </span>
          )}
        </div>
        {recommendations.map((rec, i) => (
          <div key={i} className={`card p-4 border ${
            rec.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/5' :
            rec.severity === 'success' ? 'border-emerald-500/25 bg-emerald-500/5' :
            'border-blue-500/25 bg-blue-500/5'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${rec.severity === 'warning' ? 'text-amber-400' : rec.severity === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>
              {rec.subject}
            </p>
            <p className="text-gray-300 text-sm">{rec.message}</p>
            {rec.severity === 'warning' && (
              <div className="flex gap-2 mt-2">
                <Link to="/quiz" className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                  Practice Quiz <ArrowRight className="w-3 h-3" />
                </Link>
                <Link to="/exam-prep" className="text-xs text-violet-400 hover:text-violet-300 inline-flex items-center gap-1">
                  Exam Prep <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        ))}
        <p className="text-gray-600 text-xs text-center pt-2">
          Recommendations are based on your quiz performance data. Never a guaranteed exam prediction.
        </p>
      </div>
    </div>
  )
}
