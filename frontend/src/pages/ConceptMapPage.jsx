import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, AlertTriangle, Sparkles, Loader, ZoomIn, ZoomOut } from 'lucide-react'
import toast from 'react-hot-toast'

// Simple concept map rendered with SVG
const DEMO_MAP = {
  root: { label: 'Machine Learning', x: 400, y: 50, color: '#6366f1' },
  nodes: [
    { id: 1, label: 'Supervised\nLearning', x: 150, y: 180, color: '#8b5cf6' },
    { id: 2, label: 'Unsupervised\nLearning', x: 400, y: 180, color: '#06b6d4' },
    { id: 3, label: 'Reinforcement\nLearning', x: 650, y: 180, color: '#10b981' },
    { id: 4, label: 'Classification', x: 60, y: 320, color: '#f59e0b' },
    { id: 5, label: 'Regression', x: 200, y: 320, color: '#f59e0b' },
    { id: 6, label: 'Clustering', x: 340, y: 320, color: '#3b82f6' },
    { id: 7, label: 'Dim. Reduction', x: 480, y: 320, color: '#3b82f6' },
    { id: 8, label: 'Policy\nOptimisation', x: 650, y: 320, color: '#ef4444' },
  ],
  edges: [
    { from: 'root', to: 1 }, { from: 'root', to: 2 }, { from: 'root', to: 3 },
    { from: 1, to: 4 }, { from: 1, to: 5 },
    { from: 2, to: 6 }, { from: 2, to: 7 },
    { from: 3, to: 8 },
  ],
}

function getPos(map, id) {
  if (id === 'root') return { x: map.root.x, y: map.root.y }
  const n = map.nodes.find((n) => n.id === id)
  return n ? { x: n.x, y: n.y } : { x: 0, y: 0 }
}

export default function ConceptMapPage() {
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState('')
  const [scale, setScale] = useState(1)

  const generate = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic first.')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1800))
    setGenerated(true)
    setLoading(false)
    toast.success('Concept map generated! (Demo mode)')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">Concept Map Generator</h1>
        <p className="text-gray-400 text-sm">Visualise topic relationships with AI-generated concept maps.</p>
      </div>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-amber-300 text-xs"><strong>DEMO MODE</strong> — Showing sample Machine Learning concept map. Real maps are generated from your uploaded content.</p>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (e.g., Machine Learning, Photosynthesis, French Revolution)"
          className="input-field flex-1"
          onKeyDown={(e) => e.key === 'Enter' && generate()}
        />
        <button onClick={generate} disabled={loading} className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap">
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Map'}
        </button>
      </div>

      {/* Map canvas */}
      {generated && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-semibold text-sm">Machine Learning — Concept Map</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setScale((s) => Math.min(s + 0.1, 1.5))} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setScale((s) => Math.max(s - 0.1, 0.6))} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all">
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-auto rounded-xl bg-gray-950/60 border border-gray-800">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
              <svg viewBox="0 0 800 420" className="w-full" style={{ minWidth: 500, minHeight: 350 }}>
                {/* Edges */}
                {DEMO_MAP.edges.map((edge, i) => {
                  const from = getPos(DEMO_MAP, edge.from)
                  const to = getPos(DEMO_MAP, edge.to)
                  return (
                    <line
                      key={i}
                      x1={from.x} y1={from.y + 20}
                      x2={to.x} y2={to.y - 20}
                      stroke="#374151" strokeWidth="1.5" strokeDasharray="4 2"
                    />
                  )
                })}
                {/* Root node */}
                <g>
                  <rect x={DEMO_MAP.root.x - 90} y={DEMO_MAP.root.y - 22} width={180} height={44} rx="12" fill={DEMO_MAP.root.color} opacity="0.9" />
                  <text x={DEMO_MAP.root.x} y={DEMO_MAP.root.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="700">{DEMO_MAP.root.label}</text>
                </g>
                {/* Child nodes */}
                {DEMO_MAP.nodes.map((node) => (
                  <g key={node.id}>
                    <rect x={node.x - 60} y={node.y - 20} width={120} height={42} rx="10" fill={node.color} opacity="0.75" />
                    {node.label.includes('\n') ? (
                      node.label.split('\n').map((line, li) => (
                        <text key={li} x={node.x} y={node.y - 2 + li * 16} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">{line}</text>
                      ))
                    ) : (
                      <text x={node.x} y={node.y + 6} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">{node.label}</text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2 text-center">Interactive concept map — scroll to zoom, zoom controls above</p>
        </motion.div>
      )}

      {!generated && (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-8 h-8 text-indigo-400/50" />
          </div>
          <p className="text-gray-400 font-medium">Your concept map will appear here</p>
          <p className="text-gray-600 text-sm mt-1">Enter a topic above and click Generate Map.</p>
        </div>
      )}
    </div>
  )
}
