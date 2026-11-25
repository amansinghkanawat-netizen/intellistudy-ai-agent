import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload, FileText, Image, File, X, CheckCircle, Sparkles, BookOpen,
  List, HelpCircle, AlertTriangle, Loader, Download, Eye, RefreshCw,
  Trash2, MessageSquare, Layers, Brain, ChevronRight, FileCheck, Clock,
  ArrowRight, Plus
} from 'lucide-react'
import { resourceAPI, flashcardAPI, quizAPI } from '../services/api'
import toast from 'react-hot-toast'

const ACCEPT = '.pdf,.docx,.txt,.jpg,.jpeg,.png'
const MAX_SIZE_MB = 25

const TABS = [
  { id: 'summary', label: 'Summary', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: MessageSquare },
  { id: 'tutor', label: 'Ask Tutor', icon: Brain },
]

const GENERATION_TYPES = {
  summary: { type: 'short_summary', label: 'Short Summary', desc: 'Concise overview of key points' },
  notes: { type: 'topic_notes', label: 'Topic-wise Notes', desc: 'Organised by topic/chapter' },
}

const PROGRESS_STEPS = ['Upload', 'Extract', 'Generate', 'Ready']

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png'].includes(ext)) return Image
  if (ext === 'pdf') return FileText
  return File
}

function ProgressIndicator({ step }) {
  // step: 0=Upload, 1=Extract, 2=Generate, 3=Ready
  return (
    <div className="flex items-center gap-1">
      {PROGRESS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1 text-xs font-medium transition-all ${
            i < step ? 'text-emerald-400' : i === step ? 'text-indigo-400' : 'text-gray-600'
          }`}>
            {i < step
              ? <CheckCircle className="w-3.5 h-3.5" />
              : i === step
              ? <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              : <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
            }
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < PROGRESS_STEPS.length - 1 && (
            <div className={`h-px w-4 sm:w-8 transition-colors ${i < step ? 'bg-emerald-500/50' : 'bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function StudyGeneratorPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [selectedResource, setSelectedResource] = useState(null)
  const [resourceStatus, setResourceStatus] = useState(null)

  // Upload state
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const inputRef = useRef()
  const pollRef = useRef()

  // Output state
  const [activeTab, setActiveTab] = useState('summary')
  const [generating, setGenerating] = useState(false)
  const [outputs, setOutputs] = useState({})  // { tabId: content }
  const [isDemo, setIsDemo] = useState({})

  useEffect(() => {
    loadResources()
    return () => clearInterval(pollRef.current)
  }, [])

  const loadResources = async () => {
    setLoadingResources(true)
    try {
      const data = await resourceAPI.list()
      setResources(data)
    } catch {
      // silent
    } finally {
      setLoadingResources(false)
    }
  }

  const validateAndSet = (f) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'].includes(ext)) {
      toast.error('Unsupported file type. Please upload PDF, DOCX, TXT, or image files.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }
    setFile(f)
    setOutputs({})
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSet(dropped)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resource = await resourceAPI.upload(formData, setUploadProgress)
      setSelectedResource(resource)
      setResourceStatus(resource.status)
      setFile(null)
      setOutputs({})
      toast.success('File uploaded! Processing...')
      loadResources()
      pollRef.current = setInterval(async () => {
        try {
          const updated = await resourceAPI.get(resource.id)
          setResourceStatus(updated.status)
          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(pollRef.current)
            if (updated.status === 'completed') {
              toast.success('Document processed — ready to generate study material!')
              loadResources()
            } else {
              toast.error('Document processing failed. Try re-uploading.')
            }
          }
        } catch {
          clearInterval(pollRef.current)
        }
      }, 2000)
    } catch {
      // handled globally
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async (tab = activeTab) => {
    if (!selectedResource) return toast.error('Please select a resource first.')
    if (resourceStatus !== 'completed') return toast.error('Document is still processing. Please wait.')

    if (tab === 'flashcards') {
      setGenerating(true)
      try {
        const data = await flashcardAPI.generate(selectedResource.id, 10)
        setOutputs((prev) => ({ ...prev, flashcards: data }))
        setIsDemo((prev) => ({ ...prev, flashcards: data.demo_mode }))
        toast.success(data.demo_mode ? 'Flashcards generated (Demo)' : 'Flashcards generated by IBM Granite!')
      } catch {
        // handled globally
      } finally {
        setGenerating(false)
      }
      return
    }

    if (tab === 'quiz') {
      setGenerating(true)
      try {
        const data = await quizAPI.generate({
          subject: selectedResource.original_name?.split('.')[0] || 'General',
          num_questions: 5,
          difficulty: 'medium',
          resource_id: selectedResource.id,
        })
        setOutputs((prev) => ({ ...prev, quiz: data }))
        toast.success('Quiz generated! Navigate to the Quiz page to take it.')
      } catch {
        // handled globally
      } finally {
        setGenerating(false)
      }
      return
    }

    if (tab === 'tutor') {
      navigate(`/tutor`)
      return
    }

    const typeMap = {
      summary: 'short_summary',
      notes: 'topic_notes',
    }
    const genType = typeMap[tab]
    if (!genType) return

    setGenerating(true)
    try {
      const result = await resourceAPI.generateStudyMaterial(selectedResource.id, genType)
      setOutputs((prev) => ({ ...prev, [tab]: result.content }))
      setIsDemo((prev) => ({ ...prev, [tab]: result.demo_mode }))
      toast.success(result.demo_mode ? 'Generated (Demo mode)' : 'Generated by IBM Granite!')
    } catch {
      // handled globally
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (resource) => {
    try {
      await resourceAPI.delete(resource.id)
      toast.success('Resource deleted')
      if (selectedResource?.id === resource.id) {
        setSelectedResource(null)
        setResourceStatus(null)
        setOutputs({})
      }
      loadResources()
    } catch {
      // handled globally
    }
  }

  const isReady = resourceStatus === 'completed'
  const progressStep = !selectedResource ? 0 : resourceStatus === 'completed' ? (outputs[activeTab] ? 3 : 2) : 1
  const currentOutput = outputs[activeTab]
  const FileIcon = file ? getFileIcon(file.name) : Upload

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">AI Study Workspace</h1>
          <p className="text-gray-400 text-sm">Upload materials and generate summaries, flashcards, quizzes, and more.</p>
        </div>
        <ProgressIndicator step={progressStep} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 items-start">
        {/* Left panel: resource list + upload */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload zone */}
          <div className="card p-4">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" /> Upload New Material
            </h3>

            {file ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm truncate">{file.name}</p>
                    <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {uploading && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Uploading...</span><span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
                <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                  {uploading ? <><Loader className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload & Process</>}
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                }`}
              >
                <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => e.target.files[0] && validateAndSet(e.target.files[0])} />
                <Upload className="w-6 h-6 text-indigo-400/60 mx-auto mb-2" />
                <p className="text-gray-300 text-sm font-medium">Drop file or click to browse</p>
                <p className="text-gray-600 text-xs mt-1">PDF, DOCX, TXT, Images · Max {MAX_SIZE_MB}MB</p>
              </div>
            )}
          </div>

          {/* Resource list */}
          <div className="card p-4">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              Your Materials
              <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{resources.length}</span>
            </h3>

            {loadingResources ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-800/40 animate-pulse" />)}
              </div>
            ) : resources.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No materials yet. Upload your first file above.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {resources.map((r) => {
                  const Icon = getFileIcon(r.original_name)
                  const isSelected = selectedResource?.id === r.id
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                        isSelected ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-800 hover:border-gray-700 hover:bg-white/3'
                      }`}
                      onClick={() => {
                        setSelectedResource(r)
                        setResourceStatus(r.status)
                        setOutputs({})
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-200 text-xs font-medium truncate">{r.original_name}</p>
                        <span className={`text-xs capitalize ${r.status === 'completed' ? 'text-emerald-400' : r.status === 'failed' ? 'text-red-400' : 'text-indigo-400'}`}>
                          {r.status === 'processing' ? (
                            <span className="flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" />processing</span>
                          ) : r.status}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 transition-all"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions (when resource selected) */}
          {selectedResource && isReady && (
            <div className="card p-4">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Generate Flashcards', icon: Layers, tab: 'flashcards', color: 'text-violet-400' },
                  { label: 'Create Quiz', icon: MessageSquare, tab: 'quiz', color: 'text-cyan-400' },
                  { label: 'Ask AI Tutor', icon: Brain, tab: 'tutor', color: 'text-emerald-400' },
                ].map((a) => (
                  <button
                    key={a.tab}
                    onClick={() => { setActiveTab(a.tab); handleGenerate(a.tab) }}
                    disabled={generating}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50"
                  >
                    <a.icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                    {a.label}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: tabbed content area */}
        <div className="lg:col-span-3 space-y-3">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="card min-h-96">
            {!selectedResource ? (
              <div className="flex flex-col items-center justify-center h-80 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-400/50" />
                </div>
                <p className="text-gray-300 font-medium">Select a material to get started</p>
                <p className="text-gray-600 text-sm mt-1">Upload a new file or select from your existing materials on the left.</p>
              </div>
            ) : !isReady ? (
              <div className="flex flex-col items-center justify-center h-80 p-10 text-center">
                <Loader className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                <p className="text-gray-300 font-medium">Processing document...</p>
                <p className="text-gray-500 text-sm mt-1">IBM Granite is extracting topics and content. This takes about 30-60 seconds.</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-2 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  Auto-refreshes when ready
                </div>
              </div>
            ) : currentOutput ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + JSON.stringify(currentOutput).slice(0, 20)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 h-full overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-white font-semibold text-sm">
                        {TABS.find(t => t.id === activeTab)?.label}
                      </h3>
                      {isDemo[activeTab] && <span className="badge bg-amber-500/20 text-amber-400 text-xs">DEMO</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOutputs((prev) => ({ ...prev, [activeTab]: undefined }))}
                        className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center gap-1.5 transition-all"
                      >
                        <RefreshCw className="w-3 h-3" />Regenerate
                      </button>
                      {typeof currentOutput === 'string' && (
                        <button
                          onClick={() => {
                            const el = document.createElement('a')
                            el.href = `data:text/plain;charset=utf-8,${encodeURIComponent(currentOutput)}`
                            el.download = `${activeTab}-${selectedResource.original_name}.txt`
                            el.click()
                          }}
                          className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center gap-1.5 transition-all"
                        >
                          <Download className="w-3 h-3" />Save
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Text output (summary/notes) */}
                  {typeof currentOutput === 'string' && (
                    <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">{currentOutput}</pre>
                  )}

                  {/* Flashcard output */}
                  {activeTab === 'flashcards' && currentOutput?.cards && (
                    <div>
                      <p className="text-gray-400 text-xs mb-3">
                        {currentOutput.cards.length} flashcards generated. 
                        <Link to="/flashcards" className="text-indigo-400 hover:text-indigo-300 ml-1">View in Flashcards →</Link>
                      </p>
                      <div className="space-y-2">
                        {currentOutput.cards.slice(0, 5).map((c, i) => (
                          <div key={i} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                            <p className="text-white text-sm font-medium mb-1">Q: {c.front}</p>
                            <p className="text-gray-400 text-xs">A: {c.back}</p>
                          </div>
                        ))}
                        {currentOutput.cards.length > 5 && (
                          <p className="text-gray-500 text-xs text-center pt-1">
                            +{currentOutput.cards.length - 5} more cards in Flashcards page
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quiz output */}
                  {activeTab === 'quiz' && currentOutput?.questions && (
                    <div>
                      <p className="text-gray-400 text-xs mb-3">
                        {currentOutput.questions.length} questions generated for <strong className="text-white">{currentOutput.subject}</strong>.
                        <Link to="/quiz" className="text-indigo-400 hover:text-indigo-300 ml-1">Take Quiz →</Link>
                      </p>
                      <div className="space-y-2">
                        {currentOutput.questions.slice(0, 3).map((q, i) => (
                          <div key={i} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                            <p className="text-white text-sm">Q{i + 1}: {q.question_text}</p>
                          </div>
                        ))}
                        {currentOutput.questions.length > 3 && (
                          <p className="text-gray-500 text-xs text-center pt-1">+{currentOutput.questions.length - 3} more questions</p>
                        )}
                      </div>
                      <Link to="/quiz" className="mt-3 btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Go to Quiz Page
                      </Link>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              /* Generate prompt */
              <div className="flex flex-col items-center justify-center h-80 p-10 text-center">
                {activeTab === 'tutor' ? (
                  <>
                    <Brain className="w-12 h-12 text-indigo-400/50 mb-4" />
                    <p className="text-gray-300 font-medium">Ask your AI Tutor</p>
                    <p className="text-gray-500 text-sm mt-1 mb-5">The AI Tutor uses your uploaded material to answer questions in context.</p>
                    <Link
                      to="/tutor"
                      className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />Open AI Tutor
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-indigo-400/50" />
                    </div>
                    <p className="text-gray-300 font-medium">
                      Generate {TABS.find(t => t.id === activeTab)?.label}
                    </p>
                    <p className="text-gray-500 text-sm mt-1 mb-5">
                      IBM Granite AI will analyse <strong className="text-gray-300">{selectedResource.original_name}</strong> and generate content.
                    </p>
                    <button
                      onClick={() => handleGenerate(activeTab)}
                      disabled={generating}
                      className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2"
                    >
                      {generating ? <><Loader className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Now</>}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Demo mode banner */}
          {isDemo[activeTab] && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">
                <strong>DEMO MODE</strong> — Sample output shown. Configure IBM watsonx.ai credentials in <code className="bg-black/20 px-1 rounded">.env</code> for real AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
