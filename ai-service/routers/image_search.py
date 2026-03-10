import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from config import COLLECTION_NAME, VISUAL_COLLECTION_NAME
from core.clip_embeddings import embed_image_from_base64
from core.embeddings import embed
from core.image_caption import caption_from_base64
from core.qdrant import get_client, is_available

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Image Search"])


class ImageSearchRequest(BaseModel):
    image_base64: str
    limit: Optional[int] = 10


@router.post("/image-search")
def image_search(request: ImageSearchRequest):
    """
    Search assets visually similar to the uploaded image.

    Strategy:
    1. Embed the image with CLIP (512-dim) and search `game_assets_visual`.
    2. If visual collection has results, return them directly.
    3. Fallback: use BLIP to caption the image, embed the caption with the
       multilingual sentence-transformer, and search `game_assets` (text).
    """
    if not is_available():
        raise HTTPException(status_code=503, detail="Qdrant is unavailable.")

    # --- Primary: CLIP visual search ---
    clip_vector = None
    try:
        clip_vector = embed_image_from_base64(request.image_base64)
        visual_results = get_client().query_points(
            collection_name=VISUAL_COLLECTION_NAME,
            query=clip_vector,
            limit=request.limit,
            with_payload=True,
        ).points
        if visual_results:
            return {
                "caption": "",
                "search_type": "visual",
                "results": [
                    {
                        "asset_id": r.payload.get("asset_id"),
                        "score": round(r.score, 4),
                        "title": r.payload.get("title"),
                    }
                    for r in visual_results
                ],
            }
        logger.info("CLIP visual collection empty — trying BLIP text fallback.")
    except Exception as exc:
        logger.warning("CLIP visual search failed, trying BLIP text fallback: %s", exc)

    # --- Fallback: BLIP caption → multilingual text search ---
    # caption_from_base64 returns "" if BLIP is unavailable (never raises)
    caption = caption_from_base64(request.image_base64)
    if not caption:
        # BLIP unavailable and visual collection empty — return graceful empty response
        return {"caption": "", "search_type": "visual", "results": []}

    try:
        vector = embed(caption)
        results = get_client().query_points(
            collection_name=COLLECTION_NAME,
            query=vector,
            limit=request.limit,
            with_payload=True,
        ).points
    except Exception as exc:
        logger.warning("Text fallback search failed: %s", exc)
        return {"caption": caption, "search_type": "text", "results": []}

    return {
        "caption": caption,
        "search_type": "text",
        "results": [
            {
                "asset_id": r.payload.get("asset_id"),
                "score": round(r.score, 4),
                "title": r.payload.get("title"),
            }
            for r in results
        ],
    }
