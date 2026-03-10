import logging

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import COLLECTION_NAME, VISUAL_COLLECTION_NAME
from core.clip_embeddings import embed_text_clip
from core.embeddings import batch_embed, embed
from core.qdrant import get_client, get_point_vector, is_available

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Similarity"])


@router.get("/similar/{asset_id}")
def get_similar(asset_id: str, limit: int = 10):
    """Return the top-N most similar assets to the given asset_id."""
    if not is_available():
        raise HTTPException(status_code=503, detail="Qdrant is unavailable.")
    vector = get_point_vector(asset_id)
    if vector is None:
        raise HTTPException(
            status_code=404,
            detail=f"Asset '{asset_id}' not found in index.",
        )

    results = get_client().query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        limit=limit + 1,  # +1 to account for the asset itself
        with_payload=True,
    ).points

    similar = [r for r in results if r.payload.get("asset_id") != asset_id][:limit]

    return {
        "asset_id": asset_id,
        "similar": [
            {
                "asset_id": r.payload.get("asset_id"),
                "score": round(r.score, 4),
                "title": r.payload.get("title"),
            }
            for r in similar
        ],
    }


@router.get("/search")
def semantic_search(q: str, limit: int = 10):
    """
    Hybrid search combining multilingual text model + CLIP visual model.

    - Text model  (384-dim, 60% weight): hiểu ngữ nghĩa, multilingual, tiếng Việt
    - CLIP text   (512-dim, 40% weight): so sánh text với hình ảnh thực của asset

    Kết quả được merge + dedup theo weighted combined score.
    Chỉ trả kết quả có score >= MIN_SCORE (mặc định 0.28) — dưới ngưỡng này
    là nhiễu, không liên quan.
    """
    MIN_SCORE = 0.28

    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query 'q' must not be empty.")
    if not is_available():
        raise HTTPException(status_code=503, detail="Qdrant is unavailable.")

    query = q.strip()
    client = get_client()

    # --- Search 1: multilingual text model (text collection, 384-dim) ---
    text_vector = embed(query)
    text_hits = client.query_points(
        collection_name=COLLECTION_NAME,
        query=text_vector,
        limit=limit * 2,
        with_payload=True,
    ).points

    # --- Search 2: CLIP text encoder (visual collection, 512-dim) ---
    visual_hits = []
    try:
        clip_vector = embed_text_clip(query)
        visual_hits = client.query_points(
            collection_name=VISUAL_COLLECTION_NAME,
            query=clip_vector,
            limit=limit * 2,
            with_payload=True,
        ).points
    except Exception as exc:
        logger.warning("CLIP visual text search skipped: %s", exc)

    # --- Merge: weighted score (text 60% + visual 40%) ---
    scores: dict[str, dict] = {}

    for r in text_hits:
        aid = r.payload.get("asset_id")
        if aid:
            scores[aid] = {
                "asset_id": aid,
                "title": r.payload.get("title"),
                "text_score": r.score,
                "visual_score": 0.0,
            }

    for r in visual_hits:
        aid = r.payload.get("asset_id")
        if aid:
            if aid in scores:
                scores[aid]["visual_score"] = r.score
            else:
                scores[aid] = {
                    "asset_id": aid,
                    "title": r.payload.get("title"),
                    "text_score": 0.0,
                    "visual_score": r.score,
                }

    ranked = sorted(
        scores.values(),
        key=lambda x: 0.6 * x["text_score"] + 0.4 * x["visual_score"],
        reverse=True,
    )[:limit]

    # Filter by minimum relevance threshold
    above_threshold = [
        r for r in ranked
        if round(0.6 * r["text_score"] + 0.4 * r["visual_score"], 4) >= MIN_SCORE
    ]

    return {
        "query": q,
        "available": True,   # Qdrant responded — even if results are empty
        "results": [
            {
                "asset_id": r["asset_id"],
                "score": round(0.6 * r["text_score"] + 0.4 * r["visual_score"], 4),
                "title": r["title"],
            }
            for r in above_threshold
        ],
    }


# ---------------------------------------------------------------------------
# In-memory semantic re-ranking (no Qdrant required)
# ---------------------------------------------------------------------------

class _AssetItem(BaseModel):
    asset_id: str
    title: str = ""
    description: str = ""
    tags: list[str] = []
    category: str = ""


class _RerankRequest(BaseModel):
    query: str
    assets: list[_AssetItem]
    limit: int = 10


@router.post("/search-rerank")
def search_rerank(req: _RerankRequest):
    """
    Re-rank a list of assets by semantic similarity to the query.

    Works entirely in-memory using the multilingual sentence-transformer —
    NO Qdrant required. The backend sends candidate assets fetched from
    MongoDB; this endpoint returns them sorted by cosine similarity.
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    if not req.assets:
        return {"query": req.query, "results": []}

    query = req.query.strip()

    # Build a text representation for each asset
    asset_texts: list[str] = []
    for a in req.assets:
        parts = [a.title]
        if a.category:
            parts.append(a.category)
        if a.tags:
            parts.extend(a.tags[:10])
        if a.description:
            parts.append(a.description[:300])
        asset_texts.append(" ".join(p for p in parts if p) or a.asset_id)

    # Batch-encode query + all assets in a single pass (fast)
    all_vecs: np.ndarray = batch_embed([query] + asset_texts)  # (N+1, 384)
    query_vec = all_vecs[0]   # (384,)
    asset_vecs = all_vecs[1:]  # (N, 384)

    sims = (asset_vecs @ query_vec).tolist()  # cosine similarity (both L2-normalised)

    results = sorted(
        [
            {"asset_id": req.assets[i].asset_id, "score": round(float(sims[i]), 4)}
            for i in range(len(req.assets))
        ],
        key=lambda x: x["score"],
        reverse=True,
    )

    return {"query": query, "results": results[: req.limit]}
