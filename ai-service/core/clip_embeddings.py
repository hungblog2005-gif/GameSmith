import io
import base64
import logging

import requests
from PIL import Image
from sentence_transformers import SentenceTransformer

from config import BACKEND_URL

logger = logging.getLogger(__name__)

CLIP_MODEL_NAME = "clip-ViT-B-32"
_clip_model: SentenceTransformer = None


def load_clip_model() -> None:
    global _clip_model
    logger.info("Loading CLIP model: %s", CLIP_MODEL_NAME)
    _clip_model = SentenceTransformer(CLIP_MODEL_NAME)
    logger.info("CLIP model loaded.")


def _model() -> SentenceTransformer:
    if _clip_model is None:
        load_clip_model()
    return _clip_model


def embed_image_from_base64(image_b64: str) -> list[float]:
    """Embed a base64-encoded image using CLIP (image encoder path)."""
    image_bytes = base64.b64decode(image_b64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    vec = _model().encode(image, normalize_embeddings=True)
    return vec.tolist()


def embed_image_from_url(image_url: str) -> list[float]:
    """Download an image by URL and embed it with CLIP."""
    if image_url.startswith("/"):
        image_url = f"{BACKEND_URL}{image_url}"
    resp = requests.get(image_url, timeout=3)
    resp.raise_for_status()
    image = Image.open(io.BytesIO(resp.content)).convert("RGB")
    vec = _model().encode(image, normalize_embeddings=True)
    return vec.tolist()


def embed_text_clip(text: str) -> list[float]:
    """Encode text using CLIP text encoder (same 512-dim space as image vectors).

    This enables cross-modal search: a text query can be compared directly
    against visual embeddings of asset thumbnails/previews.
    """
    vec = _model().encode(text, normalize_embeddings=True)
    return vec.tolist()
