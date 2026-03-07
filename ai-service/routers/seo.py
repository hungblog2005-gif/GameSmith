"""
AI SEO Content Generator router.

POST /generate-seo  — Generate SEO metadata for a game asset using
                      sentence-transformer cosine similarity + templates.
                      No external API required.
"""

import logging
import re
from typing import Optional

import numpy as np
from fastapi import APIRouter

from core.embeddings import embed, batch_embed
from schemas import SeoRequest, SeoResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["seo"])

# ---------------------------------------------------------------------------
# Game-dev SEO keyword vocabulary (used for keyword extraction via similarity)
# ---------------------------------------------------------------------------

_GAME_DEV_KEYWORDS: list[str] = [
    "3D model", "game asset", "unity asset", "unreal engine asset", "godot asset",
    "low poly", "high poly", "PBR texture", "texture pack", "sprite sheet",
    "character model", "environment asset", "modular asset", "tileset", "heightmap",
    "VFX", "particle effect", "shader", "animation", "rigged model",
    "skeletal animation", "royalty-free", "commercial license", "game ready",
    "AAA quality", "indie game", "mobile game", "2D asset", "3D asset",
    "fantasy asset", "sci-fi asset", "realistic asset", "cartoon asset",
    "isometric asset", "top-down asset", "RPG asset", "FPS asset",
    "platformer asset", "UI kit", "icon pack", "props", "weapon model",
    "vehicle model", "architectural asset", "foliage", "terrain",
    "polygon count", "UV mapping", "normal map", "diffuse map",
    "blend file", "FBX", "OBJ", "GLTF", "game engine compatible",
    "Unity 3D", "Unreal Engine 5", "Godot Engine", "Blender asset",
    "download game asset", "buy game asset", "game development resource",
    "pixel art", "background art", "concept art", "hand painted",
]

# Lazy-initialised per-keyword embeddings (384-dim, L2-normalised)
_keyword_vecs: Optional[np.ndarray] = None


def _ensure_keyword_vecs() -> np.ndarray:
    global _keyword_vecs
    if _keyword_vecs is not None:
        return _keyword_vecs
    logger.info("Pre-computing SEO keyword vectors for %d terms …", len(_GAME_DEV_KEYWORDS))
    _keyword_vecs = batch_embed(_GAME_DEV_KEYWORDS)
    logger.info("SEO keyword vectors ready.")
    return _keyword_vecs


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    text = re.sub(r"-+", "-", text)
    return text[:80]


def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    cut = text[: max_len - 1].rsplit(" ", 1)[0]
    return cut.rstrip(",.") + "…"


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/generate-seo", response_model=SeoResponse)
def generate_seo(body: SeoRequest):
    """
    Generate SEO metadata for a game asset.

    Uses sentence-transformer cosine similarity to select the top-10 relevant
    game-dev SEO keywords, then fills deterministic templates to produce
    title, meta_description, slug, seo_description, and extra_tags.
    """
    kw_vecs = _ensure_keyword_vecs()

    # --- Build context string ---
    parts: list[str] = []
    if body.title:
        parts.append(body.title)
    if body.short_description:
        parts.append(body.short_description[:200])
    if body.category:
        parts.append(body.category)
    if body.tags:
        parts.append(" ".join(body.tags[:10]))
    if body.file_format:
        parts.append(" ".join(body.file_format))
    context = " ".join(parts) or "game asset"

    # --- Keyword extraction via cosine similarity ---
    ctx_vec = np.array(embed(context), dtype=np.float32)
    scores: np.ndarray = kw_vecs @ ctx_vec
    top_indices = np.argsort(scores)[::-1][:15]
    top_keywords = [_GAME_DEV_KEYWORDS[i] for i in top_indices]

    # --- Extra tags (8): top short keywords not already in original tags ---
    existing_tags = set(body.tags or [])
    extra_tags: list[str] = []
    for kw in top_keywords:
        if len(kw.split()) <= 3 and kw not in existing_tags and len(extra_tags) < 8:
            extra_tags.append(kw)

    # --- SEO Title (≤60 chars) ---
    title_parts: list[str] = []
    if body.title:
        title_parts.append(body.title)
    if body.category:
        title_parts.append(body.category)
    title_parts.append("GameSmith")
    seo_title = _truncate(" | ".join(title_parts), 60)

    # --- Meta Description (≤160 chars) ---
    desc_parts: list[str] = []
    if body.short_description:
        desc_parts.append(body.short_description[:100])
    elif body.title:
        desc_parts.append(f"Download {body.title}")
    if body.file_format:
        desc_parts.append(f"Format: {', '.join(body.file_format[:3]).upper()}")
    if body.license_type and body.license_type not in ("personal",):
        desc_parts.append(f"{body.license_type.capitalize()} license.")
    desc_parts.append("Available on GameSmith.")
    meta_description = _truncate(" ".join(desc_parts), 160)

    # --- Slug ---
    slug = _slugify(body.title or "game-asset")

    # --- SEO Description (120–150 words) ---
    asset_name = body.title or "This game asset"
    category_str = f" {body.category}" if body.category else ""
    sentences: list[str] = [
        f"{asset_name} is a high-quality{category_str} game asset built for professional game development.",
    ]
    if body.short_description:
        sentences.append(body.short_description.rstrip(".") + ".")
    if body.file_format:
        fmts = ", ".join(body.file_format[:4]).upper()
        sentences.append(f"Available in {fmts} format for seamless integration into any project.")
    if body.tags:
        tag_str = ", ".join(body.tags[:5])
        sentences.append(f"Key features include: {tag_str}.")
    sentences.append(
        "Compatible with major game engines including Unity, Unreal Engine, and Godot. "
        "Fully optimised for real-time rendering with clean topology and proper UV mapping. "
        "Ideal for both indie developers and AAA studios."
    )
    if body.license_type:
        sentences.append(
            f"Distributed under a {body.license_type} license — "
            "suitable for commercial and personal projects."
        )
    sentences.append("Download instantly from GameSmith, your trusted marketplace for premium game assets.")
    seo_description = " ".join(sentences)

    return SeoResponse(
        title=seo_title,
        meta_description=meta_description,
        keywords=top_keywords[:10],
        slug=slug,
        seo_description=seo_description,
        extra_tags=extra_tags,
    )
