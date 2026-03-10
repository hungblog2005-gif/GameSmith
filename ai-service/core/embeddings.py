import logging

import numpy as np
from sentence_transformers import SentenceTransformer

from config import MODEL_NAME
from schemas import AssetPayload

logger = logging.getLogger(__name__)

_model: SentenceTransformer = None


def load_model() -> None:
    global _model
    logger.info("Loading embedding model: %s (ONNX backend)", MODEL_NAME)
    _model = SentenceTransformer(MODEL_NAME, backend="onnx")
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


def batch_embed(texts: list[str]) -> np.ndarray:
    """Batch-encode multiple texts at once (faster than calling embed() in a loop).

    Returns an (N, D) float32 array of L2-normalised vectors.
    """
    return _model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=False,
        convert_to_numpy=True,
    ).astype(np.float32)


def average_embeddings(vectors: list[list[float]]) -> list[float]:
    arr = np.array(vectors)
    avg = arr.mean(axis=0)
    norm = np.linalg.norm(avg)
    if norm > 0:
        avg = avg / norm
    return avg.tolist()
