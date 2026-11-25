from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from backend.database.db import get_db
from backend.models.models import User, Resource, QuizAttempt, FlashcardSet, ChatMessage, StudyPlan
from backend.services.auth_service import get_current_user
from backend.agents.agents import performance_agent

router = APIRouter()


@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_resources = db.query(Resource).filter(Resource.user_id == user.id).count()
    total_quizzes = db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).count()
    total_flashcard_sets = db.query(FlashcardSet).filter(FlashcardSet.user_id == user.id).count()
    total_chats = db.query(ChatMessage).filter(ChatMessage.user_id == user.id, ChatMessage.role == "user").count()

    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).all()
    avg_score = round(sum(a.score for a in quiz_attempts) / len(quiz_attempts), 1) if quiz_attempts else 0.0

    # Week-over-week quiz score change
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    recent_attempts = [a for a in quiz_attempts if a.completed_at and a.completed_at >= week_ago]
    older_attempts = [a for a in quiz_attempts if a.completed_at and a.completed_at < week_ago]
    recent_avg = sum(a.score for a in recent_attempts) / len(recent_attempts) if recent_attempts else avg_score
    older_avg = sum(a.score for a in older_attempts) / len(older_attempts) if older_attempts else avg_score
    score_change = round(recent_avg - older_avg, 1)

    # Compute study streak: count consecutive days with any quiz activity (ending today)
    all_attempt_dates = set()
    for a in quiz_attempts:
        if a.completed_at:
            all_attempt_dates.add(a.completed_at.date())
    streak = 0
    check_date = now.date()
    while check_date in all_attempt_dates:
        streak += 1
        check_date = check_date - timedelta(days=1)

    # Study hours: count quiz attempts this week × average time per quiz (est. 10 min each)
    study_hours_this_week = round(len(recent_attempts) * 10 / 60, 1)

    return {
        "total_resources": total_resources,
        "total_quizzes": total_quizzes,
        "total_flashcard_sets": total_flashcard_sets,
        "total_chat_messages": total_chats,
        "avg_quiz_score": avg_score,
        "avg_score_change": score_change,
        "study_streak": streak,
        "study_hours_this_week": study_hours_this_week,
        "topics_completed": total_resources * 3,
        "demo_mode": False,
    }


@router.get("/activity")
async def get_activity(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Weekly activity breakdown. Phase 5 will compute from real study sessions."""
    # For now, aggregate quiz and upload activity per day of current week
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    activity = []
    for i, day_name in enumerate(days):
        day_start = week_ago + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        quiz_count = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == user.id,
            QuizAttempt.completed_at >= day_start,
            QuizAttempt.completed_at < day_end,
        ).count()
        activity.append({
            "day": day_name,
            "quizzes": quiz_count,
            "hours": min(quiz_count * 0.5, 8),  # Rough estimate
            "topics": quiz_count * 2,
        })

    return {
        "weekly": activity,
        "note": "Hours and topics are estimates. Phase 5 will track real study sessions.",
    }


@router.get("/recommendations")
async def get_recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Use PerformanceAgent to generate real recommendations from quiz history."""
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(30)
        .all()
    )
    quiz_history = [
        {"subject": a.quiz.subject if a.quiz else "Unknown", "score": a.score}
        for a in attempts
    ]
    result = performance_agent.analyse(quiz_history, {})
    return result
