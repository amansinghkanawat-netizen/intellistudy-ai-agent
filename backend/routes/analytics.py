from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from backend.database.db import get_db
from backend.models.models import User, QuizAttempt, Resource, FlashcardSet
from backend.services.auth_service import get_current_user
from backend.agents.agents import performance_agent

router = APIRouter()


@router.get("")
async def get_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Comprehensive analytics for the student — powers AnalyticsPage."""
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.completed_at)
        .all()
    )

    # Subject-level averages
    subject_scores: dict[str, list[float]] = {}
    for a in attempts:
        subject = a.quiz.subject if a.quiz else "Unknown"
        subject_scores.setdefault(subject, []).append(a.score)

    avg_by_subject = {s: round(sum(scores) / len(scores), 1) for s, scores in subject_scores.items()}

    # Week-by-week overall average (last 8 weeks)
    weekly_trend = []
    now = datetime.now(timezone.utc)
    for i in range(8, 0, -1):
        wstart = now - timedelta(weeks=i)
        wend = now - timedelta(weeks=i - 1)
        week_attempts = [a for a in attempts if a.completed_at and wstart <= a.completed_at < wend]
        avg = round(sum(a.score for a in week_attempts) / len(week_attempts), 1) if week_attempts else None
        weekly_trend.append({"week": f"W{9-i}", "score": avg, "count": len(week_attempts)})

    # Topic completion (approximate from resources)
    total_resources = db.query(Resource).filter(Resource.user_id == user.id).count()

    # Performance analysis
    quiz_history = [{"subject": a.quiz.subject if a.quiz else "Unknown", "score": a.score} for a in attempts]
    perf = performance_agent.analyse(quiz_history, {})

    # Exam readiness
    readiness = performance_agent.predict_exam_readiness(avg_by_subject, total_resources * 3, max(total_resources * 5, 1))

    return {
        "subject_scores": avg_by_subject,
        "weekly_trend": weekly_trend,
        "total_quizzes": len(attempts),
        "total_resources": total_resources,
        "recommendations": perf.get("recommendations", []),
        "weak_topics": perf.get("weak_topics", []),
        "strong_topics": perf.get("strong_topics", []),
        "exam_readiness": readiness,
    }
