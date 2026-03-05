import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from config import COLLECTION_NAME, VISUAL_COLLECTION_NAME
from core.clip_embeddings import embed_image_from_base64
from core.embeddings import embed
from core.image_caption import caption_from_base64
from core.qdrant import get_client

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
    # --- Primary: CLIP visual search ---
    try:
        clip_vector = embed_image_from_base64(request.image_base64)
        visual_results = get_client().search(
            collection_name=VISUAL_COLLECTION_NAME,
            query_vector=clip_vector,
            limit=request.limit,
            with_payload=True,
        )
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
    except Exception as exc:
        logger.warning("CLIP visual search failed, falling back to BLIP: %s", exc)

    # --- Fallback: BLIP caption → multilingual text search ---
    try:
        caption = caption_from_base64(request.image_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}")

    vector = embed(caption)
    results = get_client().search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=request.limit,
        with_payload=True,
    )

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
