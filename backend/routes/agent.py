"""
Multi-Agent Orchestration endpoint.
POST /api/agent/orchestrate — runs the full agent workflow on demand.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import logging
from datetime import datetime, timezone

from backend.database.db import get_db
from backend.models.models import User, QuizAttempt
from backend.services.auth_service import get_current_user
from backend.agents.agents import orchestrator, performance_agent

router = APIRouter()
logger = logging.getLogger("intellistudy.agent")


class OrchestrateRequest(BaseModel):
    subject: str
    topic: Optional[str] = None
    score: Optional[float] = None
    resource_id: Optional[str] = None


@router.post("/orchestrate")
async def orchestrate(
    payload: OrchestrateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run the full multi-agent workflow for a given subject/topic.
    If score < 60 or not provided, triggers tutor + practice quiz generation.
    """
    score = payload.score if payload.score is not None else 0.0
    topic = payload.topic or payload.subject

    logger.info(
        f"Orchestrating for user={user.id} subject={payload.subject} "
        f"topic={topic} score={score}"
    )

    try:
        result = orchestrator.handle_low_quiz_score(
            subject=payload.subject,
            topic=topic,
            score=score,
            resource_id=payload.resource_id,
        )
        result["orchestrated_at"] = datetime.now(timezone.utc).isoformat()
        result["user_id"] = user.id
        return result
    except Exception as e:
        logger.error(f"Orchestrator error: {e}")
        raise HTTPException(500, detail=f"Orchestration failed: {str(e)}")


@router.get("/status")
async def agent_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns current agent activity status and recent trigger events for the user.
    """
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(10)
        .all()
    )

    # Find attempts that would have triggered orchestration (score < 60)
    triggers = []
    for a in attempts:
        if a.score < 60 and a.quiz:
            triggers.append({
                "event": f"Low score ({a.score}%) in {a.quiz.subject}",
                "agent": "Orchestrator",
                "time": a.completed_at.isoformat() if a.completed_at else None,
                "type": "warning",
            })

    quiz_history = [
        {"subject": a.quiz.subject if a.quiz else "Unknown", "score": a.score}
        for a in attempts
    ]
    perf = performance_agent.analyse(quiz_history, {})

    return {
        "agents": [
            {"name": "ResourceAgent", "status": "ready", "description": "Processes uploaded materials"},
            {"name": "TutorAgent", "status": "ready", "description": "RAG-powered Q&A"},
            {"name": "QuizAgent", "status": "ready", "description": "Generates & evaluates quizzes"},
            {"name": "PlannerAgent", "status": "ready", "description": "Creates study schedules"},
            {"name": "PerformanceAgent", "status": "ready", "description": "Analyses progress"},
        ],
        "recent_triggers": triggers[:5],
        "weak_topics": perf.get("weak_topics", []),
        "strong_topics": perf.get("strong_topics", []),
    }
