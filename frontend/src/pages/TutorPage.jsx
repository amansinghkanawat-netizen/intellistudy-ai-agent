import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, AlertTriangle, BookOpen } from 'lucide-react'
import { tutorAPI, resourceAPI } from '../services/api'
import toast from 'react-hot-toast'

function Message({ msg }) {
  const isAI = msg.role === 'assistant'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-gray-700'}`}>
        {isAI ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-300" />}
      </div>
      <div className={`max-w-[75%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'bg-gray-800/80 border border-gray-700/60 text-gray-200 rounded-tl-sm'
            : 'bg-indigo-500/20 border border-indigo-500/30 text-white rounded-tr-sm'
        }`}>
          <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-gray-600 text-xs">{msg.time}</span>
          {isAI && msg.is_demo && <span className="text-amber-500 text-xs">DEMO</span>}
          {isAI && !msg.is_demo && <span className="text-indigo-400 text-xs">IBM Granite</span>}
        </div>
      </div>
    </motion.div>
  )
}

export default function TutorPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI Study Tutor, powered by IBM Granite.\n\nAsk me anything about your study topics. If you select an uploaded resource, I'll answer specifically from that material using RAG (Retrieval-Augmented Generation).\n\nI support both English and Hindi.",
      time: 'now',
      is_demo: false,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState([])
  const [selectedResource, setSelectedResource] = useState(null)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    resourceAPI.list().then((data) => setResources(data.filter((r) => r.status === 'completed'))).catch(() => {})
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text, time: now, is_demo: false }])
    setLoading(true)
    try {
      const result = await tutorAPI.chat(text, selectedResource?.id || null)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_demo: result.demo_mode,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), is_demo: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  const PROMPTS = ['Explain this concept in simple terms', 'What are the key points I should remember?', 'Give me practice questions on this topic', 'यह concept हिंदी में समझाएं']

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">AI Personal Tutor</h1>
            <p className="text-gray-400 text-sm">Ask questions about your study materials. Powered by IBM Granite + RAG.</p>
          </div>
        </div>
      </div>

      {/* Resource selector */}
      {resources.length > 0 && (
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-500 text-xs">Answer from:</span>
            <button
              onClick={() => setSelectedResource(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${!selectedResource ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
            >
              General Knowledge
            </button>
            {resources.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedResource(r)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all truncate max-w-32 ${selectedResource?.id === r.id ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
              >
                {r.original_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => setInput(p)} className="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
            {p}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="card flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gray-800/80 border border-gray-700/60 rounded-tl-sm">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={selectedResource ? `Ask about ${selectedResource.original_name}...` : 'Ask your AI tutor anything...'}
            className="input-field flex-1"
            disabled={loading}
          />
          <button onClick={send} disabled={!input.trim() || loading} className="btn-primary px-4 py-3 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2 text-center">
          Press Enter to send · Supports Hindi and English
          {selectedResource && <span className="text-indigo-500"> · Answering from: {selectedResource.original_name}</span>}
        </p>
      </div>
    </div>
  )
}
