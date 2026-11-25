from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.db import get_db
from backend.models.models import User, UserRole
from backend.services.auth_service import require_admin, get_current_user

router = APIRouter()


@router.get("/stats")
async def admin_stats(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    from backend.models.models import Resource, QuizAttempt
    total_resources = db.query(Resource).count()
    total_quizzes = db.query(QuizAttempt).count()

    return {
        "total_students": total_users,
        "active_users": active_users,
        "total_resources": total_resources,
        "total_quizzes": total_quizzes,
        "demo_mode": True,
    }


@router.get("/users")
async def list_users(
    page: int = 1,
    limit: int = 20,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    users = db.query(User).offset(offset).limit(limit).all()
    total = db.query(User).count()
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.value if hasattr(u.role, "value") else u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


class UpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, detail="User not found")
    if payload.is_active is not None:
        target.is_active = payload.is_active
    if payload.role and payload.role in ("student", "admin"):
        target.role = UserRole(payload.role)
    db.commit()
    return {"message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(400, detail="Cannot delete your own account")
    db.delete(target)
    db.commit()
    return {"message": "User deleted"}
