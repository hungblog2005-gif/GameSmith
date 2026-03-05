import logging
import uuid
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from qdrant_client.http.exceptions import UnexpectedResponse

from config import CLIP_VECTOR_SIZE, COLLECTION_NAME, QDRANT_HOST, QDRANT_PORT, VECTOR_SIZE, VISUAL_COLLECTION_NAME

logger = logging.getLogger(__name__)

_client: QdrantClient = None


def init_qdrant() -> None:
    global _client
    logger.info("Connecting to Qdrant at %s:%s", QDRANT_HOST, QDRANT_PORT)
    _client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    _ensure_collection()
    _ensure_visual_collection()
    logger.info("Qdrant ready. Collections: %s, %s", COLLECTION_NAME, VISUAL_COLLECTION_NAME)


def get_client() -> QdrantClient:
    return _client


def to_uuid(asset_id: str) -> str:
    """
    Convert a MongoDB ObjectId or any string to a stable UUID v5.
    Qdrant requires point IDs to be either unsigned integers or UUIDs.
    """
    return str(uuid.uuid5(uuid.NAMESPACE_OID, asset_id))


def get_point_vector(asset_id: str) -> Optional[list[float]]:
    """Retrieve the stored vector for an asset from Qdrant."""
    results = _client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[to_uuid(asset_id)],
        with_vectors=True,
    )
    if not results:
        return None
    return results[0].vector


def get_point_vector_visual(asset_id: str) -> Optional[list[float]]:
    """Retrieve the stored CLIP vector for an asset from the visual collection."""
    results = _client.retrieve(
        collection_name=VISUAL_COLLECTION_NAME,
        ids=[to_uuid(asset_id)],
        with_vectors=True,
    )
    if not results:
        return None
    return results[0].vector


def _ensure_collection() -> None:
    """Create the text collection if it does not exist yet."""
    try:
        _client.get_collection(COLLECTION_NAME)
        logger.info("Collection '%s' already exists.", COLLECTION_NAME)
    except (UnexpectedResponse, Exception):
        _client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=qdrant_models.VectorParams(
                size=VECTOR_SIZE,
                distance=qdrant_models.Distance.COSINE,
            ),
        )
        logger.info("Collection '%s' created.", COLLECTION_NAME)


def _ensure_visual_collection() -> None:
    """Create the CLIP visual collection (512-dim) if it does not exist yet."""
    try:
        _client.get_collection(VISUAL_COLLECTION_NAME)
        logger.info("Collection '%s' already exists.", VISUAL_COLLECTION_NAME)
    except (UnexpectedResponse, Exception):
        _client.create_collection(
            collection_name=VISUAL_COLLECTION_NAME,
            vectors_config=qdrant_models.VectorParams(
                size=CLIP_VECTOR_SIZE,
                distance=qdrant_models.Distance.COSINE,
            ),
        )
        logger.info("Collection '%s' created.", VISUAL_COLLECTION_NAME)
