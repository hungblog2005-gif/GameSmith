import logging
import numpy as np

from fastapi import APIRouter, HTTPException
from qdrant_client.http import models as qdrant_models

from config import COLLECTION_NAME, VISUAL_COLLECTION_NAME
from core.clip_embeddings import embed_image_from_url
from core.embeddings import build_text, embed
from core.qdrant import get_client, is_available, to_uuid
from schemas import AssetPayload, BatchIndexRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Indexing"])

MAX_PREVIEW_IMAGES = 3   # embed at most this many previews per asset


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
    """
    Embed ALL available images (thumbnail + previews) for the asset using CLIP,
    average their vectors, and upsert the averaged vector into the visual collection.

    By averaging multiple images we get a richer visual representation: a text
    query like 'núi' (mountain) or 'xe hơi' (car) will match assets whose ANY
    preview image visually matches that concept.
    """
    # Collect unique URLs: thumbnail first, then up to MAX_PREVIEW_IMAGES previews
    urls: list[str] = []
    if asset.image_url:
        urls.append(asset.image_url)
    for url in (asset.preview_urls or [])[:MAX_PREVIEW_IMAGES]:
        if url and url not in urls:
            urls.append(url)

    if not urls:
        return

    vectors: list[list[float]] = []
    for url in urls:
        try:
            vec = embed_image_from_url(url)
            vectors.append(vec)
        except Exception as exc:
            logger.debug("CLIP embed skipped for url %s: %s", url, exc)

    if not vectors:
        logger.warning("Visual indexing skipped for %s — no images could be embedded", asset.asset_id)
        return

    # Average and L2-normalise
    avg = np.mean(np.array(vectors, dtype=np.float32), axis=0)
    norm = np.linalg.norm(avg)
    if norm > 0:
        avg = avg / norm
    vis_vec = avg.tolist()

    try:
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
        logger.debug(
            "Visual indexed %s using %d/%d images",
            asset.asset_id, len(vectors), len(urls),
        )
    except Exception as exc:
        logger.warning("Visual indexing skipped for %s: %s", asset.asset_id, exc)


@router.post("/index-asset", status_code=201)
def index_asset(asset: AssetPayload):
    """Generate an embedding for one asset and upsert it in Qdrant."""
    if not is_available():
        raise HTTPException(status_code=503, detail="Qdrant is unavailable — indexing disabled.")
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
    """Batch-index many assets at once (used for initial reindex.)"""
    if not is_available():
        raise HTTPException(status_code=503, detail="Qdrant is unavailable — indexing disabled.")
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
