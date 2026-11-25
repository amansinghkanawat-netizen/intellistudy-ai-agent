"""
IntelliStudy – Smart Study Generator Agent
FastAPI Backend Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

from backend.config import settings
from backend.database.db import engine, Base

# Import all models so SQLAlchemy creates tables
from backend.models import models  # noqa: F401

# Import routers
from backend.routes import auth, dashboard, resources, flashcards, quiz, tutor, planner, admin, analytics, agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intellistudy")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.vector_store_path, exist_ok=True)
    logger.info(f"IntelliStudy started — Demo mode: {settings.demo_mode}")
    if settings.demo_mode:
        logger.warning(
            "IBM watsonx.ai credentials not configured. "
            "Running in DEMO mode with sample AI responses. "
            "Set WATSONX_API_KEY and WATSONX_PROJECT_ID in .env to enable real AI."
        )
    yield
    logger.info("IntelliStudy shutting down")


app = FastAPI(
    title="IntelliStudy API",
    description="AI-powered study platform backend. Powered by IBM Granite via watsonx.ai.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploaded resources)
if os.path.exists(settings.upload_dir):
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["Flashcards"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["AI Tutor"])
app.include_router(planner.router, prefix="/api/planner", tags=["Study Planner"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agents"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "IntelliStudy API",
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "status": "running",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "demo_mode": settings.demo_mode,
        "watsonx_configured": not settings.demo_mode,
    }
