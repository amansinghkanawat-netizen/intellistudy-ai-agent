<<<<<<< HEAD
# 🎓 IntelliStudy – Smart Study Generator Agent

> **Your Personal AI Learning Companion**
> Powered by IBM Granite AI via IBM watsonx.ai

![IntelliStudy](https://img.shields.io/badge/IntelliStudy-v1.0.0-6366f1?style=for-the-badge)
![IBM Granite](https://img.shields.io/badge/IBM_Granite-watsonx.ai-0f62fe?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🚀 Overview

IntelliStudy is a **full-stack AI-powered EdTech platform** that transforms student study materials into intelligent learning resources. Upload a PDF, DOCX, TXT, or textbook image — and IntelliStudy uses IBM Granite foundation models to generate summaries, flashcards, quizzes, concept maps, and personalised study plans — all in seconds.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **AI Study Generator** | Upload PDF / DOCX / TXT / Images → AI generates summaries, topic notes, key definitions, important questions |
| 🃏 **Smart Flashcards** | Auto-generated flashcard sets with flip animation, mastery tracking, and difficulty ratings |
| 📝 **Quiz Generator** | MCQ, True/False quizzes with countdown timer, auto-scoring, and explanations |
| 🤖 **AI Personal Tutor** | RAG-powered chatbot that answers questions from your own uploaded materials |
| 🗺️ **Concept Maps** | Visual topic relationship maps generated from study content |
| 📅 **Smart Study Planner** | AI-generated personalised daily/weekly timetables based on exam date and difficulty |
| 📊 **Predictive Analytics** | Performance radar, weekly trends, exam readiness score, weak-topic detection |
| 🛡️ **Admin Dashboard** | Full user management — activate, suspend, promote, delete users |
| 👤 **User Profiles** | Edit profile, change password with strength meter, real learning stats |
| 🔐 **Authentication** | JWT-based login/register, role-based access (Student / Admin) |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Component-based UI
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Smooth animations and transitions
- **Recharts** — Interactive charts and analytics
- **Lucide React** — Premium icon set
- **Axios** — API communication
- **React Hot Toast** — Notification system

### Backend
- **Python 3.11+** — Runtime
- **FastAPI** — High-performance REST API
- **SQLAlchemy** — ORM with SQLite (dev) / PostgreSQL (prod)
- **python-jose** — JWT authentication
- **passlib + bcrypt** — Secure password hashing
- **PyMuPDF / python-docx / Pillow** — Document and image processing
- **TF-IDF RAG Pipeline** — Retrieval-Augmented Generation (no external dependencies)

### AI
- **IBM Granite** via **IBM watsonx.ai** — Foundation model for all AI features
- **Multi-Agent Architecture** — 5 specialized AI agents
- **RAG Pipeline** — TF-IDF retriever (+ optional FAISS semantic search)
- **Demo Mode** — Clearly labelled fallback when credentials not configured

### Database
- **SQLite** (development) — Zero-config, file-based
- **PostgreSQL** (production) — Recommended for deployment

---

## 📂 Project Structure

```
IntelliStudy/
├── frontend/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Navbar, Footer
│   │   │   ├── dashboard/           # Sidebar, DashboardTopbar
│   │   │   └── ui/                  # Shared design system components
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Animated landing page
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx    # Student dashboard with real API
│   │   │   ├── StudyGeneratorPage.jsx
│   │   │   ├── TutorPage.jsx        # RAG chatbot
│   │   │   ├── FlashcardsPage.jsx   # Collections + mastery tracking
│   │   │   ├── QuizPage.jsx         # Timer + keyboard nav
│   │   │   ├── ConceptMapPage.jsx
│   │   │   ├── PlannerPage.jsx
│   │   │   ├── AnalyticsPage.jsx    # Radar + trend charts
│   │   │   ├── ProfilePage.jsx      # Edit profile + change password
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   └── AdminUsersPage.jsx   # User management table
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT auth context
│   │   ├── services/
│   │   │   └── api.js               # Axios client for all endpoints
│   │   └── index.css                # Tailwind + design system
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # pydantic-settings configuration
│   ├── database/
│   │   └── db.py                    # SQLAlchemy engine + session
│   ├── models/
│   │   └── models.py                # 10 ORM models
│   ├── routes/
│   │   ├── auth.py                  # register, login, me, change-password, profile
│   │   ├── dashboard.py             # stats, activity, recommendations
│   │   ├── resources.py             # upload, list, get, generate, delete
│   │   ├── flashcards.py            # generate, list, get-set, update
│   │   ├── quiz.py                  # generate, submit, history
│   │   ├── tutor.py                 # RAG chat, history
│   │   ├── planner.py               # create, list
│   │   ├── admin.py                 # stats, users CRUD
│   │   └── analytics.py             # full analytics + readiness score
│   ├── services/
│   │   ├── auth_service.py          # JWT + bcrypt
│   │   └── granite_service.py       # IBM Granite + demo fallback
│   ├── agents/
│   │   └── agents.py                # 5 AI agents + AgentOrchestrator
│   ├── rag/
│   │   └── pipeline.py              # Text chunker + TF-IDF retriever
│   └── requirements.txt
│
├── storage/                         # File uploads + vector store
├── scripts/                         # Utility scripts
│   ├── e2e_test.py                  # Full API test suite (12 tests)
│   └── promote_admin.py             # Promote user to admin
├── docs/
├── intellistudy.db                  # SQLite database (dev)
├── .env.example                     # Environment variable template
├── Dockerfile
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- Git

### Step 1 — Clone and configure environment

```bash
git clone <your-repo-url>
cd IntelliStudy

# Copy environment template
cp .env.example .env
# Edit .env — add IBM credentials OR leave blank for Demo mode
```

### Step 2 — Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

> **Windows users:** Use `py` instead of `python`/`pip`:
> ```powershell
> py -m pip install -r backend/requirements.txt
> ```

### Step 3 — Install frontend dependencies

```bash
cd frontend
npm install
```

---

## ▶️ Running the Application

### Start Backend (Terminal 1)

```bash
# From project root
py -m uvicorn backend.main:app --reload --port 8000 --host 127.0.0.1
```

| URL | Description |
|---|---|
| http://localhost:8000 | API root (health check) |
| http://localhost:8000/docs | Swagger interactive API docs |
| http://localhost:8000/redoc | ReDoc API reference |

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

| URL | Description |
|---|---|
| http://localhost:3000 | **IntelliStudy App** ← open this |

---

## 🔑 IBM watsonx.ai Configuration

To enable **real IBM Granite AI** (instead of demo mode):

1. Create IBM Cloud account → https://cloud.ibm.com
2. Create a watsonx.ai project → https://dataplatform.cloud.ibm.com
3. Generate API key → https://cloud.ibm.com/iam/apikeys
4. Add to your `.env` file:

```env
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_MODEL_ID=ibm/granite-13b-instruct-v2
```

5. Restart the backend — `demo_mode` will switch to `false` automatically.

> **Demo Mode:** If credentials are not configured, the platform runs in clearly labelled **DEMO mode** with sample AI responses. All UI features remain fully functional.

---

## 👤 Default Accounts

After first run, register your own account at http://localhost:3000/register

To create an admin account:
```bash
# 1. Register normally at /register
# 2. Run the promote script
py scripts/promote_admin.py
# Edit the script to use your email first
```

---

## 🗄️ Database Models

| Model | Description |
|---|---|
| `User` | Student/Admin accounts with roles |
| `Resource` | Uploaded documents with extraction status |
| `Summary` | AI-generated study material per resource |
| `FlashcardSet` | Collection of flashcards |
| `Flashcard` | Individual card with front/back/difficulty/mastery |
| `Quiz` | Generated quiz with subject/topic/difficulty |
| `QuizQuestion` | Individual question with options and answer |
| `QuizAttempt` | Student attempt with score and answers |
| `StudyPlan` | AI-generated timetable |
| `ChatMessage` | Tutor chat history (user + AI messages) |

---

## 🤖 Multi-Agent AI System

| Agent | Responsibility |
|---|---|
| **ResourceAgent** | Extracts and processes uploaded documents |
| **TutorAgent** | Answers questions using RAG from uploaded materials |
| **QuizAgent** | Generates and evaluates quizzes |
| **PlannerAgent** | Creates personalized study schedules |
| **PerformanceAgent** | Analyses weak topics, generates recommendations |

**Orchestrator workflow:** When a student scores low on a quiz → PerformanceAgent detects weak topic → TutorAgent prepares explanation → QuizAgent schedules practice → PlannerAgent adjusts revision schedule.

---

## 🔐 Security

- ✅ Passwords hashed with **bcrypt** (passlib)
- ✅ **JWT** authentication (python-jose), 24hr expiry
- ✅ All API routes **protected** with Bearer token
- ✅ File type **allowlist** validation (PDF, DOCX, TXT, JPG, PNG)
- ✅ File size limit (25 MB default)
- ✅ **User data isolation** — all DB queries scoped to `user_id`
- ✅ **Role-based access control** — Admin routes require admin role
- ✅ All secrets via **environment variables** — never hardcoded
- ✅ CORS configured for local development

---

## 🧪 Running Tests

```bash
# Full API end-to-end test (12 test cases)
py scripts/e2e_test.py
```

Expected output:
```
=== END-TO-END TEST RESULTS ===
  PASS  Login as admin
  PASS  GET /auth/me
  PASS  PATCH /auth/profile
  PASS  PUT /auth/change-password
  PASS  Re-login with new password
  PASS  GET /admin/users
  PASS  GET /flashcards list
  PASS  GET /flashcards/{set_id}
  PASS  GET /dashboard/stats
  PASS  GET /analytics
  PASS  GET /dashboard/recommendations
  PASS  Password reset back to Test1234
=== 12/12 PASSED ===
```

---

## 📊 Development Status

- [x] **Phase 1** — Frontend UI, Auth pages, Student Dashboard, Admin Dashboard
- [x] **Phase 2** — FastAPI backend, Database models, JWT auth, File upload, OCR
- [x] **Phase 3** — IBM Granite integration, RAG pipeline, Multi-agent system
- [x] **Phase 4** — Study Generator, AI Tutor, Flashcards, Quiz, Concept Maps
- [x] **Phase 5** — Study Planner, Predictive Analytics, Performance tracking
- [x] **Phase 6** — Testing (12/12 pass), Security, Responsive design, Documentation
- [ ] **Phase 7** *(optional)* — IBM Cloud Code Engine deployment

---

## 🚢 Production Deployment

### Docker

```bash
docker build -t intellistudy .
docker run -p 8000:8000 --env-file .env intellistudy
```

### IBM Cloud Code Engine

```bash
ibmcloud ce application create \
  --name intellistudy-api \
  --image us.icr.io/intellistudy/api:latest \
  --port 8000 \
  --env-from-secret intellistudy-secrets
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ using IBM Granite AI · IntelliStudy – Study Smarter. Learn Faster. Achieve More.*
=======
# intellistudy-ai-agent
>>>>>>> eb993a98cab69397d861413b06d93a54a4906da3
