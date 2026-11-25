from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json

from backend.database.db import get_db
from backend.models.models import User, FlashcardSet, Flashcard, Resource, ResourceStatus, DifficultyLevel
from backend.services.auth_service import get_current_user
from backend.services.granite_service import granite_service

router = APIRouter()

DEMO_FLASHCARDS = [
    {"front": "What is Supervised Learning?", "back": "A type of ML where the model learns from labelled training data to predict outputs for new inputs.", "difficulty": "easy"},
    {"front": "Define Overfitting", "back": "When a model learns the training data too well, including noise, causing poor performance on new data. Prevented by regularisation and dropout.", "difficulty": "medium"},
    {"front": "What is Backpropagation?", "back": "An algorithm for training neural networks by propagating error gradients backwards through layers to update weights via gradient descent.", "difficulty": "hard"},
    {"front": "What is the Bias-Variance Tradeoff?", "back": "The balance between model complexity (variance) and simplicity (bias). High bias → underfitting. High variance → overfitting.", "difficulty": "medium"},
    {"front": "Explain K-Means Clustering", "back": "An unsupervised algorithm that partitions n observations into k clusters, iteratively assigning each point to the nearest centroid.", "difficulty": "medium"},
]


class GenerateRequest(BaseModel):
    resource_id: str = None
    count: int = 10


class UpdateCardRequest(BaseModel):
    mastered: bool = None
    difficulty: str = None


@router.post("/generate")
async def generate_flashcards(
    payload: GenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    context = ""
    is_demo = True
    resource_id = payload.resource_id

    if resource_id:
        resource = db.query(Resource).filter(Resource.id == resource_id, Resource.user_id == user.id).first()
        if not resource:
            raise HTTPException(404, detail="Resource not found")
        if resource.status == ResourceStatus.completed and resource.extracted_text:
            context = resource.extracted_text
            is_demo = False

    if context:
        instruction = f"Generate {payload.count} flashcards as JSON array. Each card: {{\"front\": \"question\", \"back\": \"answer\", \"difficulty\": \"easy|medium|hard\"}}. Only output the JSON array."
        result = granite_service.generate(instruction, context, "flashcards")
        # Try to parse JSON from response
        try:
            cards_data = json.loads(result["text"])
            is_demo = result["demo_mode"]
        except Exception:
            cards_data = DEMO_FLASHCARDS[:payload.count]
            is_demo = True
    else:
        cards_data = DEMO_FLASHCARDS[:payload.count]

    # Save flashcard set
    flashcard_set = FlashcardSet(
        user_id=user.id,
        resource_id=resource_id,
        title=f"Flashcard Set — {len(cards_data)} cards",
        is_demo=is_demo,
    )
    db.add(flashcard_set)
    db.flush()

    for card_data in cards_data:
        difficulty = card_data.get("difficulty", "medium")
        if difficulty not in ("easy", "medium", "hard"):
            difficulty = "medium"
        card = Flashcard(
            set_id=flashcard_set.id,
            front=card_data.get("front", ""),
            back=card_data.get("back", ""),
            difficulty=DifficultyLevel(difficulty),
        )
        db.add(card)

    db.commit()
    db.refresh(flashcard_set)

    return {
        "set_id": flashcard_set.id,
        "title": flashcard_set.title,
        "demo_mode": is_demo,
        "cards": [
            {"id": c.id, "front": c.front, "back": c.back, "difficulty": c.difficulty.value, "mastered": c.mastered}
            for c in flashcard_set.cards
        ],
    }


@router.get("")
async def list_flashcard_sets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sets = db.query(FlashcardSet).filter(FlashcardSet.user_id == user.id).order_by(FlashcardSet.created_at.desc()).all()
    return [
        {"id": s.id, "title": s.title, "card_count": len(s.cards), "is_demo": s.is_demo, "created_at": s.created_at.isoformat()}
        for s in sets
    ]


@router.get("/{set_id}")
async def get_flashcard_set(
    set_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    flashcard_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.user_id == user.id).first()
    if not flashcard_set:
        raise HTTPException(404, detail="Flashcard set not found")
    return {
        "set_id": flashcard_set.id,
        "title": flashcard_set.title,
        "demo_mode": flashcard_set.is_demo,
        "cards": [
            {"id": c.id, "front": c.front, "back": c.back, "difficulty": c.difficulty.value, "mastered": c.mastered}
            for c in flashcard_set.cards
        ],
    }


@router.patch("/{card_id}")
async def update_flashcard(
    card_id: str,
    payload: UpdateCardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Flashcard).join(FlashcardSet).filter(Flashcard.id == card_id, FlashcardSet.user_id == user.id).first()
    if not card:
        raise HTTPException(404, detail="Flashcard not found")
    if payload.mastered is not None:
        card.mastered = payload.mastered
    if payload.difficulty:
        card.difficulty = DifficultyLevel(payload.difficulty)
    db.commit()
    return {"message": "Updated", "mastered": card.mastered}
