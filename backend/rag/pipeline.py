"""
RAG (Retrieval-Augmented Generation) Pipeline
Handles document chunking, embedding, vector storage, and retrieval.
Falls back gracefully when heavy ML libraries are unavailable.
"""
import os
import json
import hashlib
import logging
from typing import Optional
from backend.config import settings

logger = logging.getLogger("intellistudy.rag")


# ─── Text Chunker ──────────────────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
    """Split text into overlapping chunks for RAG indexing."""
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap
    if not text or not text.strip():
        return []

    # Split on paragraph breaks first, then sentences
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 <= chunk_size:
            current = (current + "\n\n" + para).strip()
        else:
            if current:
                chunks.append(current)
            # If single paragraph exceeds chunk_size, split by sentence
            if len(para) > chunk_size:
                sentences = para.replace(". ", ".\n").split("\n")
                sub = ""
                for sent in sentences:
                    if len(sub) + len(sent) + 1 <= chunk_size:
                        sub = (sub + " " + sent).strip()
                    else:
                        if sub:
                            chunks.append(sub)
                        sub = sent
                if sub:
                    chunks.append(sub)
            else:
                current = para

    if current:
        chunks.append(current)

    # Add overlap by prepending tail of previous chunk
    if overlap > 0 and len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            tail = chunks[i - 1][-overlap:]
            overlapped.append(tail + " " + chunks[i])
        return overlapped

    return chunks


# ─── Simple TF-IDF fallback retriever ─────────────────────────────────────
class SimpleFallbackRetriever:
    """
    Keyword-based fallback retriever used when sentence-transformers/FAISS
    are not installed. Uses TF-IDF cosine similarity via sklearn if available,
    otherwise falls back to basic term overlap.
    """
    def __init__(self):
        self._chunks: list[str] = []

    def index(self, chunks: list[str]):
        self._chunks = chunks

    def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        if not self._chunks:
            return []
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np
            corpus = self._chunks + [query]
            tfidf = TfidfVectorizer(stop_words="english").fit_transform(corpus)
            scores = cosine_similarity(tfidf[-1:], tfidf[:-1]).flatten()
            top_idx = np.argsort(scores)[::-1][:top_k]
            return [self._chunks[i] for i in top_idx]
        except ImportError:
            # Basic term overlap fallback
            q_terms = set(query.lower().split())
            scored = []
            for chunk in self._chunks:
                chunk_terms = set(chunk.lower().split())
                score = len(q_terms & chunk_terms) / max(len(q_terms), 1)
                scored.append((score, chunk))
            scored.sort(reverse=True)
            return [c for _, c in scored[:top_k]]


# ─── Embedding-based retriever ─────────────────────────────────────────────
class EmbeddingRetriever:
    """
    Sentence-transformer + FAISS retriever.
    Used when sentence-transformers and faiss-cpu are installed.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self._model = None
        self._index = None
        self._chunks: list[str] = []
        self._model_name = model_name

    def _load_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self._model_name)
            logger.info(f"Loaded embedding model: {self._model_name}")

    def index(self, chunks: list[str]):
        import numpy as np
        import faiss
        self._load_model()
        self._chunks = chunks
        embeddings = self._model.encode(chunks, show_progress_bar=False)
        embeddings = np.array(embeddings, dtype="float32")
        faiss.normalize_L2(embeddings)
        dim = embeddings.shape[1]
        self._index = faiss.IndexFlatIP(dim)
        self._index.add(embeddings)

    def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        import numpy as np
        import faiss
        if not self._index or not self._chunks:
            return []
        self._load_model()
        q_emb = self._model.encode([query], show_progress_bar=False)
        q_emb = np.array(q_emb, dtype="float32")
        faiss.normalize_L2(q_emb)
        k = min(top_k, len(self._chunks))
        _, indices = self._index.search(q_emb, k)
        return [self._chunks[i] for i in indices[0] if i < len(self._chunks)]


# ─── RAG Pipeline ─────────────────────────────────────────────────────────
class RAGPipeline:
    """
    Main RAG pipeline that:
    1. Chunks document text
    2. Indexes chunks (embedding or fallback)
    3. Retrieves relevant chunks for a query
    4. Passes context + query to Granite for generation
    """

    def __init__(self):
        self._retriever = None
        self._use_embeddings = False
        self._try_embeddings()

    def _try_embeddings(self):
        try:
            import sentence_transformers
            import faiss
            self._retriever = EmbeddingRetriever()
            self._use_embeddings = True
            logger.info("RAG: Using sentence-transformer + FAISS retriever")
        except ImportError:
            self._retriever = SimpleFallbackRetriever()
            self._use_embeddings = False
            logger.info("RAG: Using TF-IDF/keyword fallback retriever (install sentence-transformers + faiss-cpu for semantic search)")

    def index_document(self, text: str, resource_id: str) -> int:
        """Chunk and index a document. Returns number of chunks."""
        chunks = chunk_text(text)
        if not chunks:
            return 0
        self._retriever.index(chunks)
        # Persist chunks to disk
        self._save_chunks(resource_id, chunks)
        return len(chunks)

    def retrieve_context(self, query: str, resource_id: str = None, top_k: int = None) -> str:
        """Retrieve relevant chunks and return as context string."""
        top_k = top_k or settings.top_k_chunks
        if resource_id:
            self._load_chunks(resource_id)
        chunks = self._retriever.retrieve(query, top_k=top_k)
        return "\n\n---\n\n".join(chunks)

    def _save_chunks(self, resource_id: str, chunks: list[str]):
        path = os.path.join(settings.vector_store_path, f"{resource_id}.json")
        os.makedirs(settings.vector_store_path, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"chunks": chunks}, f, ensure_ascii=False)

    def _load_chunks(self, resource_id: str):
        path = os.path.join(settings.vector_store_path, f"{resource_id}.json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            self._retriever.index(data.get("chunks", []))


rag_pipeline = RAGPipeline()
