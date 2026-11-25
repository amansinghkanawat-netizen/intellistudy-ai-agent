from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import json
import logging

from backend.database.db import get_db
from backend.models.models import User, StudyPlan, QuizAttempt
from backend.services.auth_service import get_current_user
from backend.agents.agents import planner_agent, performance_agent

router = APIRouter()
logger = logging.getLogger("intellistudy.planner")


class CreatePlanRequest(BaseModel):
    subjects: list[str]
    exam_date: Optional[str] = None
    daily_hours: float = 3.0
    difficulty: str = "Medium"


@router.post("/create")
async def create_plan(
    payload: CreatePlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.subjects:
        raise HTTPException(400, detail="At least one subject is required")
    if not (0.5 <= payload.daily_hours <= 12):
        raise HTTPException(400, detail="Daily hours must be between 0.5 and 12")

    # Get weak topics from performance analysis
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(20)
        .all()
    )
    quiz_history_data = [
        {"subject": a.quiz.subject if a.quiz else "Unknown", "score": a.score}
        for a in attempts
    ]
    perf = performance_agent.analyse(quiz_history_data, {})
    weak_topics = perf.get("weak_topics", [])

    # Use PlannerAgent
    result = planner_agent.create_plan(
        subjects=payload.subjects,
        exam_date=payload.exam_date or "Not specified",
        daily_hours=payload.daily_hours,
        difficulty=payload.difficulty,
        weak_topics=weak_topics,
    )

    plan = StudyPlan(
        user_id=user.id,
        subjects=json.dumps(payload.subjects),
        daily_hours=payload.daily_hours,
        difficulty=payload.difficulty,
        plan_data=json.dumps(result["plan"]),
        is_demo=result["demo_mode"],
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "plan_id": plan.id,
        "plan": result["plan"],
        "weak_topics_considered": weak_topics,
        "demo_mode": result["demo_mode"],
    }


@router.get("")
async def get_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == user.id)
        .order_by(StudyPlan.created_at.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "id": p.id,
            "subjects": json.loads(p.subjects) if p.subjects else [],
            "daily_hours": p.daily_hours,
            "difficulty": p.difficulty,
            "is_demo": p.is_demo,
            "created_at": p.created_at.isoformat(),
            "plan": json.loads(p.plan_data) if p.plan_data else [],
        }
        for p in plans
    ]


@router.get("/latest")
async def get_latest_plan(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == user.id)
        .order_by(StudyPlan.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(404, detail="No study plan found. Create one first.")
    return {
        "id": plan.id,
        "subjects": json.loads(plan.subjects) if plan.subjects else [],
        "daily_hours": plan.daily_hours,
        "difficulty": plan.difficulty,
        "is_demo": plan.is_demo,
        "created_at": plan.created_at.isoformat(),
        "plan": json.loads(plan.plan_data) if plan.plan_data else [],
    }
