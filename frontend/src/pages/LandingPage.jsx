import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Zap, ArrowRight, BookOpen, Brain, Layers, MessageSquare,
  Calendar, TrendingUp, GitBranch, Upload, Sparkles, CheckCircle,
  Star, Users, Award, Clock, ChevronRight, Shield, Globe
} from 'lucide-react'

// ─── Animation helpers ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' } }),
}

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Features data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BookOpen,
    title: 'Smart Summaries',
    desc: 'Upload any PDF, DOCX, or image. IBM Granite AI distills dense content into concise, structured summaries with key insights.',
    color: 'from-indigo-500 to-blue-600',
    badge: 'AI-Powered',
  },
  {
    icon: Layers,
    title: 'Auto Flashcards',
    desc: 'Automatically generate interactive flashcards with spaced-repetition tracking to maximise long-term retention.',
    color: 'from-violet-500 to-purple-600',
    badge: 'Smart Learning',
  },
  {
    icon: MessageSquare,
    title: 'MCQ Quiz Generator',
    desc: 'Adaptive quizzes with multiple choice, true/false, and short-answer questions — with real-time scoring and explanations.',
    color: 'from-cyan-500 to-teal-600',
    badge: 'Interactive',
  },
  {
    icon: Brain,
    title: 'AI Personal Tutor',
    desc: 'Ask questions about your uploaded materials. Get step-by-step explanations in English or Hindi, powered by IBM Granite.',
    color: 'from-pink-500 to-rose-600',
    badge: 'Multilingual',
  },
  {
    icon: GitBranch,
    title: 'Concept Maps',
    desc: 'Visualise complex topics with dynamic concept maps showing relationships between ideas, automatically generated from your content.',
    color: 'from-orange-500 to-amber-600',
    badge: 'Visual Learning',
  },
  {
    icon: Calendar,
    title: 'Smart Study Planner',
    desc: 'AI-generated personalised timetables based on exam dates, difficulty, and your learning pace — auto-adjusted by performance.',
    color: 'from-emerald-500 to-green-600',
    badge: 'Personalised',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Materials', desc: 'Upload PDFs, DOCX, TXT files, or textbook images. We support everything students actually use.', icon: Upload },
  { step: '02', title: 'AI Processes & Analyses', desc: 'IBM Granite AI extracts, chunks, embeds, and deeply understands your study content via RAG pipeline.', icon: Sparkles },
  { step: '03', title: 'Personalised Learning Resources', desc: 'Instantly receive summaries, flashcards, quizzes, concept maps, and an adaptive study plan.', icon: BookOpen },
  { step: '04', title: 'Track & Improve', desc: 'Predictive analytics monitor weak areas and re-route your study plan to maximise exam performance.', icon: TrendingUp },
]

const STATS = [
  { value: '50K+', label: 'Active Students', icon: Users },
  { value: '2M+', label: 'Resources Processed', icon: BookOpen },
  { value: '95%', label: 'Satisfaction Rate', icon: Star },
  { value: '40%', label: 'Better Exam Scores', icon: Award },
]

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'B.Tech Computer Science',
    avatar: 'PS',
    text: 'IntelliStudy completely transformed how I prepare for exams. The AI flashcards alone saved me 3 hours per week!',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'MBA Student',
    avatar: 'RV',
    text: 'The concept maps helped me understand complex business strategy frameworks visually. Absolutely brilliant tool.',
    rating: 5,
  },
  {
    name: 'Anjali Patel',
    role: 'Medical Student',
    avatar: 'AP',
    text: 'I uploaded 400-page textbooks and got perfect summaries with important definitions. The AI tutor explains everything clearly.',
    rating: 5,
  },
]

// ─── Main component ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-gray-950 overflow-x-hidden">
      <HeroSection />
      <LogoBar />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Deep gradient background */}
      <div className="absolute inset-0" style={{background:'linear-gradient(135deg,#0a0618 0%,#1a0533 25%,#0d1a3d 60%,#060412 100%)'}} />
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Primary hero glow — centre */}
      <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      {/* Secondary glow — top right */}
      <div className="hero-glow-2 absolute top-16 right-1/4" />

      {/* Large ambient orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse-slow"
           style={{background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent 70%)'}} />
      <div className="absolute -bottom-32 right-0 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse-slow animation-delay-400"
           style={{background:'radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)'}} />
      <div className="absolute top-1/3 -right-20 w-[300px] h-[300px] rounded-full blur-3xl animate-pulse-slow animation-delay-200"
           style={{background:'radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)'}} />

      {/* Small floating orbs */}
      <div className="absolute top-20 left-10 w-24 h-24 rounded-full blur-2xl animate-float"
           style={{background:'radial-gradient(circle,rgba(99,102,241,0.3),transparent)'}} />
      <div className="absolute bottom-32 right-10 w-36 h-36 rounded-full blur-3xl animate-float animation-delay-400"
           style={{background:'radial-gradient(circle,rgba(139,92,246,0.25),transparent)'}} />
      <div className="absolute top-1/2 left-24 w-16 h-16 rounded-full blur-2xl animate-float animation-delay-200"
           style={{background:'radial-gradient(circle,rgba(6,182,212,0.3),transparent)'}} />
      <div className="absolute top-1/4 right-1/3 w-12 h-12 rounded-full blur-xl animate-pulse-slow animation-delay-600"
           style={{background:'radial-gradient(circle,rgba(236,72,153,0.2),transparent)'}} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Powered by IBM Granite AI · watsonx.ai
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.1] tracking-tight mb-6"
            >
              Study Smarter.{' '}
              <span className="gradient-text">Learn Faster.</span>{' '}
              Achieve More.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg"
            >
              Upload your study materials and let IBM Granite AI transform them into smart summaries, flashcards, quizzes, concept maps, and a personalised study plan — all in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-7">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary flex items-center justify-center gap-2 text-base py-3.5 px-7">
                Explore Features
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap items-center gap-5 text-sm text-gray-400"
            >
              {['No credit card required', 'Free tier available', 'IBM Cloud secured'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function HeroIllustration() {
  return (
    <div className="relative">
      {/* Main card */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="glass rounded-2xl p-6 shadow-glow-lg"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AI Processing Complete</p>
            <p className="text-gray-400 text-xs">Machine Learning Fundamentals.pdf</p>
          </div>
          <span className="ml-auto badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Done</span>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Smart Summary', count: '3 pages → 1 page', color: 'indigo' },
            { label: 'Flashcards Generated', count: '24 cards', color: 'violet' },
            { label: 'Quiz Questions', count: '15 MCQs created', color: 'cyan' },
            { label: 'Study Plan', count: '7-day schedule', color: 'emerald' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                <span className="text-gray-200 text-sm">{item.label}</span>
              </div>
              <span className="text-gray-400 text-xs">{item.count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating badge cards */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -top-6 -right-6 glass rounded-xl px-4 py-2.5 shadow-card"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
          <span className="text-white text-sm font-semibold">98% Accuracy</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-4 -left-6 glass rounded-xl px-4 py-2.5 shadow-card"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-white text-sm font-semibold">Saves 4hrs/week</span>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Logo Bar ──────────────────────────────────────────────────────────────
function LogoBar() {
  return (
    <div className="border-y border-gray-800/60 bg-gray-900/40 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-gray-500 text-sm mb-5">Trusted technology powering IntelliStudy</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {['IBM Granite', 'watsonx.ai', 'IBM Cloud', 'PostgreSQL', 'FastAPI', 'React'].map((tech) => (
            <span key={tech} className="text-gray-400 font-semibold text-sm hover:text-white transition-colors">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 mb-4">
            Platform Features
          </span>
          <h2 className="section-heading mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Excel Academically</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Six powerful AI-driven tools that work together to create a complete, personalised learning experience.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <FeatureCard {...f} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, badge }) {
  return (
    <div className="card-hover p-6 group">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <span className="badge bg-gray-800 text-gray-400 text-xs ml-2 mt-0.5">{badge}</span>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── How It Works ──────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <span className="badge bg-violet-500/15 text-violet-400 border border-violet-500/25 mb-4">
            How It Works
          </span>
          <h2 className="section-heading mb-4">
            From Upload to{' '}
            <span className="gradient-text">Exam-Ready in Minutes</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Our multi-agent AI pipeline handles everything — you just study smarter.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.1}>
              <div className="relative card p-6 group hover:border-indigo-500/30 transition-all">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-gradient-to-r from-indigo-500/50 to-transparent z-10" />
                )}
                <div className="text-5xl font-display font-black text-indigo-500/15 mb-4 leading-none">{step.step}</div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-4 group-hover:bg-indigo-500/25 transition-all">
                  <step.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Animated Counter Hook ────────────────────────────────────────────────
function useCountUp(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])
  return count
}

// ─── Stats ────────────────────────────────────────────────────────────────
const STATS_DATA = [
  { end: 50000, suffix: '+', label: 'Active Students', icon: Users, color: 'from-indigo-500 to-blue-600' },
  { end: 2000000, suffix: '+', label: 'Resources Processed', icon: BookOpen, color: 'from-violet-500 to-purple-600' },
  { end: 95, suffix: '%', label: 'Satisfaction Rate', icon: Star, color: 'from-pink-500 to-rose-600' },
  { end: 40, suffix: '%', label: 'Better Exam Scores', icon: Award, color: 'from-emerald-500 to-green-600' },
]

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return n.toString()
}

function AnimatedStatCard({ stat, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const count = useCountUp(stat.end, 1800 + index * 100, inView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative card p-6 text-center group hover:border-indigo-500/30 transition-all overflow-hidden"
    >
      {/* Background gradient blob */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${stat.color}`} />

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <stat.icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-display font-black gradient-text mb-1 tabular-nums">
        {formatCount(count)}{stat.suffix}
      </div>
      <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
    </motion.div>
  )
}

function StatsSection() {
  return (
    <section className="py-24 relative overflow-hidden" id="about">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 mb-4">
            Platform Impact
          </span>
          <h2 className="section-heading mb-4">
            Trusted by <span className="gradient-text">Thousands of Students</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            IntelliStudy is redefining how students prepare — one AI-powered study session at a time.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS_DATA.map((stat, i) => (
            <AnimatedStatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-4">
          <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
            ⚠️ Sample Content — Not real user reviews
          </span>
        </FadeIn>
        <FadeIn className="text-center mb-14">
          <h2 className="section-heading mb-4">
            Students <span className="gradient-text">Love IntelliStudy</span>
          </h2>
          <p className="text-gray-400">These are illustrative testimonials for demonstration purposes.</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="card-hover p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <div className="relative card p-10 md:p-14 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/10 to-transparent" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
                Ready to Study <span className="gradient-text">Smarter?</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students already using IntelliStudy. Start free — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base py-4 px-8">
                  Start Learning for Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 text-base py-4 px-8">
                  Sign In
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-indigo-400" /> IBM Cloud Secured</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-violet-400" /> Available Worldwide</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-cyan-400" /> GDPR Compliant</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
