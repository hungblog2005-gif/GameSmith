from fastapi import APIRouter

from config import COLLECTION_NAME

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    return {"status": "ok", "collection": COLLECTION_NAME}
