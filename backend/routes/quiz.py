from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import json
import logging

from backend.database.db import get_db
from backend.models.models import User, Quiz, QuizQuestion, QuizAttempt, DifficultyLevel, Resource
from backend.services.auth_service import get_current_user
from backend.agents.agents import quiz_agent, orchestrator

router = APIRouter()
logger = logging.getLogger("intellistudy.quiz")


class GenerateQuizRequest(BaseModel):
    subject: str = "Data Structures"
    topic: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = 5
    resource_id: Optional[str] = None


class SubmitQuizRequest(BaseModel):
    answers: dict  # {question_id: answer_index}


@router.post("/generate")
async def generate_quiz(
    payload: GenerateQuizRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    difficulty = payload.difficulty.lower()
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"
    if not (1 <= payload.num_questions <= 20):
        raise HTTPException(400, detail="num_questions must be between 1 and 20")

    # Fetch context from resource if provided
    context = ""
    if payload.resource_id:
        resource = db.query(Resource).filter(
            Resource.id == payload.resource_id,
            Resource.user_id == user.id,
        ).first()
        if not resource:
            raise HTTPException(404, detail="Resource not found")
        context = resource.extracted_text or ""

    # Use QuizAgent to generate questions
    questions_data = quiz_agent.generate_questions(
        context=context,
        subject=payload.subject,
        difficulty=difficulty,
        num=payload.num_questions,
        topic=payload.topic,
    )

    # Persist quiz to DB
    quiz = Quiz(
        resource_id=payload.resource_id,
        subject=payload.subject,
        topic=payload.topic,
        difficulty=DifficultyLevel(difficulty),
        is_demo=not bool(context),
    )
    db.add(quiz)
    db.flush()

    for i, qd in enumerate(questions_data):
        options = qd.get("options", [])
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=qd.get("question_text", ""),
            question_type=qd.get("question_type", "mcq"),
            options=json.dumps(options),
            correct_answer_index=qd.get("correct_answer_index", 0),
            explanation=qd.get("explanation", ""),
            order=i,
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)

    return {
        "quiz_id": quiz.id,
        "subject": quiz.subject,
        "topic": quiz.topic,
        "difficulty": difficulty,
        "demo_mode": quiz.is_demo,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "options": json.loads(q.options) if q.options else [],
                "order": q.order,
            }
            for q in sorted(quiz.questions, key=lambda x: x.order)
        ],
    }


@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    payload: SubmitQuizRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(404, detail="Quiz not found")

    questions = sorted(quiz.questions, key=lambda x: x.order)
    if not questions:
        raise HTTPException(422, detail="Quiz has no questions")

    correct = 0
    results = []
    for q in questions:
        user_answer = payload.answers.get(q.id)
        is_correct = user_answer == q.correct_answer_index
        if is_correct:
            correct += 1
        results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "user_answer": user_answer,
            "correct_answer": q.correct_answer_index,
            "options": json.loads(q.options) if q.options else [],
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    score_pct = round((correct / len(questions)) * 100, 1)

    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz.id,
        score=score_pct,
        total_questions=len(questions),
        answers=json.dumps(payload.answers),
    )
    db.add(attempt)
    db.commit()

    # Trigger orchestrator if score is low
    agent_response = None
    if score_pct < 60 and quiz.subject and quiz.topic:
        try:
            agent_response = orchestrator.handle_low_quiz_score(
                subject=quiz.subject,
                topic=quiz.topic or quiz.subject,
                score=score_pct,
                resource_id=quiz.resource_id,
            )
        except Exception as e:
            logger.warning(f"Orchestrator failed: {e}")

    return {
        "attempt_id": attempt.id,
        "score": score_pct,
        "correct": correct,
        "total": len(questions),
        "results": results,
        "agent_response": agent_response,
    }


@router.get("/history")
async def quiz_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": a.id,
            "quiz_id": a.quiz_id,
            "quiz_subject": a.quiz.subject if a.quiz else "N/A",
            "quiz_topic": a.quiz.topic if a.quiz else None,
            "score": a.score,
            "total_questions": a.total_questions,
            "completed_at": a.completed_at.isoformat(),
        }
        for a in attempts
    ]
