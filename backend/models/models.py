from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from backend.database.db import Base


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class ResourceStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# ─── User ─────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    education_level = Column(String(100), default="Bachelor's Degree")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    resources = relationship("Resource", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    flashcard_sets = relationship("FlashcardSet", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


# ─── Resource ─────────────────────────────────────────────────────────────
class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(Enum(ResourceStatus), default=ResourceStatus.pending)
    extracted_text = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="resources")
    summaries = relationship("Summary", back_populates="resource", cascade="all, delete-orphan")
    flashcard_sets = relationship("FlashcardSet", back_populates="resource", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="resource", cascade="all, delete-orphan")


# ─── Summary ──────────────────────────────────────────────────────────────
class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=new_uuid)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False)
    summary_type = Column(String(50), nullable=False)  # short_summary, detailed_summary, etc.
    content = Column(Text, nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    resource = relationship("Resource", back_populates="summaries")


# ─── Flashcard Set ────────────────────────────────────────────────────────
class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=True)
    title = Column(String(255), nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="flashcard_sets")
    resource = relationship("Resource", back_populates="flashcard_sets")
    cards = relationship("Flashcard", back_populates="set", cascade="all, delete-orphan")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True, default=new_uuid)
    set_id = Column(String, ForeignKey("flashcard_sets.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium)
    mastered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    set = relationship("FlashcardSet", back_populates="cards")


# ─── Quiz ─────────────────────────────────────────────────────────────────
class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=new_uuid)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=True)
    subject = Column(String(255))
    topic = Column(String(255))
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    resource = relationship("Resource", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=new_uuid)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default="mcq")
    options = Column(Text)  # JSON array stored as text
    correct_answer_index = Column(Integer)
    explanation = Column(Text)
    order = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    answers = Column(Text)  # JSON
    completed_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")


# ─── Study Plan ───────────────────────────────────────────────────────────
class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    subjects = Column(Text)  # JSON list
    exam_date = Column(DateTime(timezone=True), nullable=True)
    daily_hours = Column(Float, default=3.0)
    difficulty = Column(String(20), default="Medium")
    plan_data = Column(Text)  # JSON
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="study_plans")


# ─── Chat ─────────────────────────────────────────────────────────────────
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=True)
    role = Column(String(20), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="chat_messages")
