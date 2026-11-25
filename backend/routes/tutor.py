from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import logging

from backend.database.db import get_db
from backend.models.models import User, ChatMessage, Resource
from backend.services.auth_service import get_current_user
from backend.agents.agents import tutor_agent

router = APIRouter()
logger = logging.getLogger("intellistudy.tutor")


class ChatRequest(BaseModel):
    message: str
    resource_id: Optional[str] = None
    language: str = "auto"  # auto | English | Hindi


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(400, detail="Message cannot be empty")

    # Validate resource ownership if provided
    if payload.resource_id:
        resource = db.query(Resource).filter(
            Resource.id == payload.resource_id,
            Resource.user_id == user.id,
        ).first()
        if not resource:
            raise HTTPException(404, detail="Resource not found")

    # Use TutorAgent with RAG
    result = tutor_agent.answer(
        question=payload.message.strip(),
        resource_id=payload.resource_id,
        language=payload.language,
    )

    # Persist conversation
    user_msg = ChatMessage(
        user_id=user.id,
        resource_id=payload.resource_id,
        role="user",
        content=payload.message.strip(),
        is_demo=False,
    )
    ai_msg = ChatMessage(
        user_id=user.id,
        resource_id=payload.resource_id,
        role="assistant",
        content=result["answer"],
        is_demo=result["demo_mode"],
    )
    db.add(user_msg)
    db.add(ai_msg)
    db.commit()

    return {
        "response": result["answer"],
        "demo_mode": result["demo_mode"],
        "has_context": result["has_context"],
        "agent": result["agent"],
    }


@router.get("/history")
async def chat_history(
    resource_id: Optional[str] = None,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == user.id)
    if resource_id:
        query = query.filter(ChatMessage.resource_id == resource_id)
    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "is_demo": m.is_demo,
            "resource_id": m.resource_id,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(messages)
    ]
