"""
AI Auto-Tagging router.

POST /suggest-tags  — CLIP zero-shot tag scoring from thumbnail image and/or text.
GET  /tags          — Return the full tag vocabulary grouped by category.
"""

import json
import logging
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import APIRouter, HTTPException

from core.clip_embeddings import embed_image_from_url, embed_text_clip
from schemas import TagSuggestRequest, TagSuggestResponse, TagSuggestion

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tagging"])

# ---------------------------------------------------------------------------
# Vocabulary loading
# ---------------------------------------------------------------------------

_VOCAB_PATH = Path(__file__).parent.parent / "tag_vocabulary.json"


def _load_vocabulary() -> dict:
    with open(_VOCAB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


_VOCABULARY: dict = _load_vocabulary()

# Build flat list of {tag, group, prompt} for scoring
_FLAT_TAGS: list[dict] = []
for _group in _VOCABULARY["groups"]:
    for _item in _group["tags"]:
        _FLAT_TAGS.append(
            {
                "tag": _item["tag"],
                "group": _group["label"],
                "group_id": _group["id"],
                "prompt": _item["prompt"],
            }
        )

# Pre-computed CLIP text vectors — lazy-initialised on first suggest request
_tag_vectors: Optional[np.ndarray] = None  # shape: (N, 512)

CONFIDENCE_THRESHOLD = 0.22
MAX_SUGGESTIONS = 15


def _ensure_tag_vectors() -> np.ndarray:
    global _tag_vectors
    if _tag_vectors is not None:
        return _tag_vectors
    logger.info("Pre-computing CLIP tag prompt vectors for %d tags …", len(_FLAT_TAGS))
    vecs = [embed_text_clip(item["prompt"]) for item in _FLAT_TAGS]
    _tag_vectors = np.array(vecs, dtype=np.float32)  # (N, 512) — already L2-normalised
    logger.info("Tag vectors ready.")
    return _tag_vectors


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/tags")
def get_vocabulary():
    """Return the full tag vocabulary grouped by category."""
    return _VOCABULARY


@router.post("/suggest-tags", response_model=TagSuggestResponse)
def suggest_tags(body: TagSuggestRequest):
    """
    Score each tag in the vocabulary against the provided image / text context.

    Priority:
      1. thumbnail_url  →  CLIP image embedding  (best accuracy)
      2. title + description  →  CLIP text embedding  (fallback when no image)
    """
    try:
        tag_vecs = _ensure_tag_vectors()
    except Exception as exc:
        logger.warning("Tag vectors unavailable (CLIP model not loaded): %s", exc)
        return TagSuggestResponse(suggested_tags=[], vocabulary=_VOCABULARY)

    # --- Build query vector ---
    query_vec: Optional[np.ndarray] = None

    if body.thumbnail_url:
        try:
            query_vec = np.array(
                embed_image_from_url(body.thumbnail_url), dtype=np.float32
            )
        except Exception as exc:
            logger.warning("Failed to embed thumbnail '%s': %s", body.thumbnail_url, exc)

    if query_vec is None:
        # Fallback: encode title + description + category via CLIP text encoder
        parts: list[str] = []
        if body.title:
            parts.append(body.title)
        if body.description:
            parts.append(body.description[:300])
        if body.category_name:
            parts.append(f"category: {body.category_name}")
        if not parts:
            # No usable context — return empty suggestions instead of 400
            logger.warning("suggest_tags: no thumbnail or text context provided, returning empty.")
            return TagSuggestResponse(suggested_tags=[], vocabulary=_VOCABULARY)
        query_vec = np.array(embed_text_clip(" ".join(parts)), dtype=np.float32)

    # --- Score all tags (CLIP vectors are L2-normalised → dot == cosine sim) ---
    scores: np.ndarray = (tag_vecs @ query_vec).copy()  # shape (N,) — writable copy

    # --- Boost scores from file structure analysis ---
    if body.file_names:
        try:
            from core.file_analysis import analyze_file_structure
            file_boosts = analyze_file_structure(body.file_names)
            if file_boosts:
                tag_name_to_idx = {item["tag"]: i for i, item in enumerate(_FLAT_TAGS)}
                for tag_name, boost_val in file_boosts.items():
                    if tag_name in tag_name_to_idx:
                        idx = tag_name_to_idx[tag_name]
                        scores[idx] = float(min(scores[idx] + boost_val, 1.0))
        except Exception as exc:
            logger.warning("file_analysis boost failed: %s", exc)

    suggestions: list[TagSuggestion] = []
    for i, score in enumerate(scores.tolist()):
        if score >= CONFIDENCE_THRESHOLD:
            suggestions.append(
                TagSuggestion(
                    tag=_FLAT_TAGS[i]["tag"],
                    group=_FLAT_TAGS[i]["group"],
                    score=round(score, 4),
                )
            )

    suggestions.sort(key=lambda x: x.score, reverse=True)
    suggestions = suggestions[:MAX_SUGGESTIONS]

    return TagSuggestResponse(suggested_tags=suggestions, vocabulary=_VOCABULARY)
