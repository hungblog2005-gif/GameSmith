from fastapi import APIRouter, HTTPException

from config import COLLECTION_NAME
from core.embeddings import embed
from core.qdrant import get_client, get_point_vector

router = APIRouter(tags=["Similarity"])


@router.get("/similar/{asset_id}")
def get_similar(asset_id: str, limit: int = 10):
    """Return the top-N most similar assets to the given asset_id."""
    vector = get_point_vector(asset_id)
    if vector is None:
        raise HTTPException(
            status_code=404,
            detail=f"Asset '{asset_id}' not found in index.",
        )

    results = get_client().search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=limit + 1,  # +1 to account for the asset itself
        with_payload=True,
    )

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
    """Semantic search: embed a free-text query and return the closest assets."""
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query 'q' must not be empty.")

    vector = embed(q.strip())

    results = get_client().search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=limit,
        with_payload=True,
    )

    return {
        "query": q,
        "results": [
            {
                "asset_id": r.payload.get("asset_id"),
                "score": round(r.score, 4),
                "title": r.payload.get("title"),
            }
            for r in results
        ],
    }
