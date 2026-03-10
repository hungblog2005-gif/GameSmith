from fastapi import APIRouter, HTTPException

from config import COLLECTION_NAME
from core.embeddings import average_embeddings
from core.qdrant import get_client, get_point_vector, is_available
from schemas import UserRecommendationRequest

router = APIRouter(tags=["Recommendations"])


@router.post("/recommendations/user")
def user_recommendations(request: UserRecommendationRequest):
    """
    Return personalised recommendations for a user.
    Averages embeddings of the user's purchased/viewed assets and finds similar ones.
    """
    if not is_available():
        raise HTTPException(status_code=503, detail="Qdrant is unavailable.")
    if not request.asset_ids:
        raise HTTPException(status_code=400, detail="asset_ids must not be empty.")

    vectors = [
        vec
        for aid in request.asset_ids
        if (vec := get_point_vector(aid)) is not None
    ]

    if not vectors:
        raise HTTPException(
            status_code=404,
            detail="None of the provided asset IDs were found in the index.",
        )

    avg_vector = average_embeddings(vectors)
    all_exclude = set(request.asset_ids) | set(request.exclude_ids or [])

    results = get_client().query_points(
        collection_name=COLLECTION_NAME,
        query=avg_vector,
        limit=request.limit + len(all_exclude),  # over-fetch then filter
        with_payload=True,
    ).points

    recommendations = [
        r for r in results if r.payload.get("asset_id") not in all_exclude
    ][: request.limit]

    return {
        "recommendations": [
            {
                "asset_id": r.payload.get("asset_id"),
                "score": round(r.score, 4),
                "title": r.payload.get("title"),
            }
            for r in recommendations
        ],
    }
