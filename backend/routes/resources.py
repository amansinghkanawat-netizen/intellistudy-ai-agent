import os
import uuid
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.database.db import get_db
from backend.models.models import User, Resource, ResourceStatus, Summary
from backend.services.auth_service import get_current_user
from backend.agents.agents import resource_agent
from backend.rag.pipeline import rag_pipeline, chunk_text
from backend.services.granite_service import granite_service
from backend.config import settings

router = APIRouter()
logger = logging.getLogger("intellistudy.resources")


def _get_ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _extract_text(filepath: str, ext: str) -> str:
    """Extract text from uploaded file. Supports PDF, DOCX, TXT, images (OCR)."""
    try:
        if ext == "txt":
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        elif ext == "pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(filepath)
                pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text.strip())
                return "\n\n".join(pages)
            except ImportError:
                return "[PDF extraction requires pypdf. Install: pip install pypdf]"

        elif ext == "docx":
            try:
                from docx import Document
                doc = Document(filepath)
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            except ImportError:
                return "[DOCX extraction requires python-docx. Install: pip install python-docx]"

        elif ext in ("jpg", "jpeg", "png"):
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(filepath)
                return pytesseract.image_to_string(img)
            except ImportError:
                return "[OCR extraction requires pytesseract and Pillow. Install: pip install pytesseract Pillow]"
            except Exception as e:
                return f"[OCR failed: {e}. Ensure Tesseract is installed on the system.]"

    except Exception as e:
        logger.error(f"Text extraction error for {filepath}: {e}")
        return f"[Text extraction error: {e}]"
    return ""


def _process_in_background(resource_id: str, filepath: str, ext: str):
    """Background task: extract text, chunk, and index for RAG."""
    from backend.database.db import SessionLocal
    db = SessionLocal()
    try:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return

        resource.status = ResourceStatus.processing
        db.commit()

        # Extract text
        text = _extract_text(filepath, ext)
        resource.extracted_text = text[:100000]  # Store up to 100K chars

        # Chunk and index for RAG
        if text.strip():
            chunk_count = rag_pipeline.index_document(text, resource_id)
            resource.chunk_count = chunk_count
            logger.info(f"Indexed {chunk_count} chunks for resource {resource_id}")

        resource.status = ResourceStatus.completed
        resource.processed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Resource {resource_id} processed successfully")

    except Exception as e:
        logger.error(f"Background processing failed for {resource_id}: {e}")
        try:
            db.query(Resource).filter(Resource.id == resource_id).update({"status": ResourceStatus.failed})
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/upload")
async def upload_resource(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(400, detail="No filename provided")
    ext = _get_ext(file.filename)
    if ext not in settings.allowed_ext_list:
        raise HTTPException(400, detail=f"File type '.{ext}' not allowed. Supported: {', '.join(settings.allowed_ext_list)}")

    content = await file.read()
    size_limit = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > size_limit:
        raise HTTPException(400, detail=f"File size {len(content) // (1024*1024)}MB exceeds the {settings.max_upload_size_mb}MB limit.")

    # Save file to user-scoped directory
    unique_name = f"{uuid.uuid4()}.{ext}"
    user_dir = os.path.join(settings.upload_dir, user.id)
    os.makedirs(user_dir, exist_ok=True)
    filepath = os.path.join(user_dir, unique_name)
    with open(filepath, "wb") as f:
        f.write(content)

    resource = Resource(
        user_id=user.id,
        filename=unique_name,
        original_name=file.filename,
        file_type=ext,
        file_size=len(content),
        status=ResourceStatus.pending,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    # Kick off background extraction
    background_tasks.add_task(_process_in_background, resource.id, filepath, ext)

    return _resource_dict(resource)


@router.get("")
async def list_resources(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resources = (
        db.query(Resource)
        .filter(Resource.user_id == user.id)
        .order_by(Resource.created_at.desc())
        .all()
    )
    return [_resource_dict(r) for r in resources]


@router.get("/{resource_id}")
async def get_resource(resource_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resource = _get_owned_resource(resource_id, user.id, db)
    return {
        **_resource_dict(resource),
        "has_text": bool(resource.extracted_text),
        "chunk_count": resource.chunk_count,
        "summaries": [
            {"id": s.id, "type": s.summary_type, "is_demo": s.is_demo, "created_at": s.created_at.isoformat()}
            for s in resource.summaries
        ],
    }


class GenerateRequest(BaseModel):
    type: str  # short_summary | detailed_summary | topic_notes | questions | revision


@router.post("/{resource_id}/generate")
async def generate_study_material(
    resource_id: str,
    payload: GenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_owned_resource(resource_id, user.id, db)

    if resource.status == ResourceStatus.processing:
        raise HTTPException(202, detail="Document is still being processed. Please try again in a moment.")
    if resource.status == ResourceStatus.failed:
        raise HTTPException(422, detail="Document processing failed. Please re-upload the file.")

    # Check if we already have this type cached
    existing = next((s for s in resource.summaries if s.summary_type == payload.type), None)
    if existing:
        return {
            "content": existing.content,
            "demo_mode": existing.is_demo,
            "summary_id": existing.id,
            "cached": True,
        }

    # Use ResourceAgent to generate content
    text = resource.extracted_text or ""
    content = resource_agent.summarise(text, style=payload.type)

    # Determine if it was a demo response
    is_demo = settings.demo_mode

    # Persist to DB
    summary = Summary(
        resource_id=resource.id,
        summary_type=payload.type,
        content=content,
        is_demo=is_demo,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    return {
        "content": content,
        "demo_mode": is_demo,
        "summary_id": summary.id,
        "cached": False,
    }


@router.post("/{resource_id}/extract-topics")
async def extract_topics(resource_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resource = _get_owned_resource(resource_id, user.id, db)
    if not resource.extracted_text:
        raise HTTPException(400, detail="No extracted text available for this resource.")
    result = resource_agent.extract_topics(resource.extracted_text)
    return result


@router.delete("/{resource_id}")
async def delete_resource(resource_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resource = _get_owned_resource(resource_id, user.id, db)
    # Remove file from disk
    filepath = os.path.join(settings.upload_dir, user.id, resource.filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except OSError:
            pass
    # Remove vector store chunk file
    chunk_file = os.path.join(settings.vector_store_path, f"{resource.id}.json")
    if os.path.exists(chunk_file):
        try:
            os.remove(chunk_file)
        except OSError:
            pass
    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted successfully"}


# ─── Helpers ──────────────────────────────────────────────────────────────
def _get_owned_resource(resource_id: str, user_id: str, db: Session) -> Resource:
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.user_id == user_id).first()
    if not resource:
        raise HTTPException(404, detail="Resource not found")
    return resource


def _resource_dict(resource: Resource) -> dict:
    return {
        "id": resource.id,
        "original_name": resource.original_name,
        "file_type": resource.file_type,
        "file_size": resource.file_size,
        "status": resource.status.value if hasattr(resource.status, "value") else resource.status,
        "created_at": resource.created_at.isoformat() if resource.created_at else None,
        "processed_at": resource.processed_at.isoformat() if resource.processed_at else None,
    }
