import logging

from fastapi import APIRouter
from qdrant_client.http import models as qdrant_models

from config import COLLECTION_NAME, VISUAL_COLLECTION_NAME
from core.clip_embeddings import embed_image_from_url
from core.embeddings import build_text, embed
from core.qdrant import get_client, to_uuid
from schemas import AssetPayload, BatchIndexRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Indexing"])


def _visual_payload(asset: AssetPayload) -> dict:
    return {
        "asset_id": asset.asset_id,
        "title": asset.title,
        "category": asset.category,
        "tags": asset.tags,
        "style": asset.style,
        "status": asset.status,
    }


def _try_index_visual(asset: AssetPayload) -> None:
    """Try to embed asset image with CLIP and upsert into the visual collection."""
    if not asset.image_url:
        return
    try:
        vis_vec = embed_image_from_url(asset.image_url)
        get_client().upsert(
            collection_name=VISUAL_COLLECTION_NAME,
            points=[
                qdrant_models.PointStruct(
                    id=to_uuid(asset.asset_id),
                    vector=vis_vec,
                    payload=_visual_payload(asset),
                )
            ],
        )
    except Exception as exc:
        logger.warning("Visual indexing skipped for %s: %s", asset.asset_id, exc)


@router.post("/index-asset", status_code=201)
def index_asset(asset: AssetPayload):
    """Generate an embedding for one asset and upsert it in Qdrant."""
    vector = embed(build_text(asset))
    get_client().upsert(
        collection_name=COLLECTION_NAME,
        points=[
            qdrant_models.PointStruct(
                id=to_uuid(asset.asset_id),
                vector=vector,
                payload={
                    "asset_id": asset.asset_id,
                    "title": asset.title,
                    "category": asset.category,
                    "tags": asset.tags,
                    "style": asset.style,
                    "status": asset.status,
                },
            )
        ],
    )
    _try_index_visual(asset)
    return {"indexed": asset.asset_id}


@router.post("/index-batch", status_code=201)
def index_batch(request: BatchIndexRequest):
    """Batch-index many assets at once (used for initial reindex)."""
    if not request.assets:
        return {"indexed": 0}

    points = [
        qdrant_models.PointStruct(
            id=to_uuid(asset.asset_id),
            vector=embed(build_text(asset)),
            payload={
                "asset_id": asset.asset_id,
                "title": asset.title,
                "category": asset.category,
                "tags": asset.tags,
                "style": asset.style,
                "status": asset.status,
            },
        )
        for asset in request.assets
    ]

    batch_size = 100
    total = 0
    for i in range(0, len(points), batch_size):
        get_client().upsert(
            collection_name=COLLECTION_NAME,
            points=points[i : i + batch_size],
        )
        total += len(points[i : i + batch_size])

    # Visual indexing per asset (skip failures gracefully)
    for asset in request.assets:
        _try_index_visual(asset)

    return {"indexed": total}


@router.delete("/index/{asset_id}", status_code=200)
def delete_index(asset_id: str):
    """Remove an asset's embedding from Qdrant (both text and visual collections)."""
    get_client().delete(
        collection_name=COLLECTION_NAME,
        points_selector=qdrant_models.PointIdsList(points=[to_uuid(asset_id)]),
    )
    try:
        get_client().delete(
            collection_name=VISUAL_COLLECTION_NAME,
            points_selector=qdrant_models.PointIdsList(points=[to_uuid(asset_id)]),
        )
    except Exception as exc:
        logger.warning("Visual delete skipped for %s: %s", asset_id, exc)
    return {"deleted": asset_id}
