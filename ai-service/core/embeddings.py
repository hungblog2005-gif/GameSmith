import logging

import numpy as np
from sentence_transformers import SentenceTransformer

from config import MODEL_NAME
from schemas import AssetPayload

logger = logging.getLogger(__name__)

_model: SentenceTransformer = None


def load_model() -> None:
    global _model
    logger.info("Loading embedding model: %s", MODEL_NAME)
    _model = SentenceTransformer(MODEL_NAME)
    logger.info("Embedding model loaded.")


def build_text(asset: AssetPayload) -> str:
    """Combine asset metadata into a single string for embedding."""
    parts = [
        asset.title,
        asset.description or "",
        " ".join(asset.tags or []),
        asset.category or "",
        asset.style or "",
    ]
    return " ".join(p for p in parts if p).strip()


def embed(text: str) -> list[float]:
    vec = _model.encode(text, normalize_embeddings=True)
    return vec.tolist()


def average_embeddings(vectors: list[list[float]]) -> list[float]:
    arr = np.array(vectors)
    avg = arr.mean(axis=0)
    norm = np.linalg.norm(avg)
    if norm > 0:
        avg = avg / norm
    return avg.tolist()
