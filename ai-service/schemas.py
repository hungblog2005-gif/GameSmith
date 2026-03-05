from typing import Optional
from pydantic import BaseModel


class AssetPayload(BaseModel):
    asset_id: str
    title: str
    description: Optional[str] = ""
    tags: Optional[list[str]] = []
    category: Optional[str] = ""
    style: Optional[str] = ""
    status: Optional[str] = "published"
    # URL of thumbnail or first preview image (used for CLIP visual indexing)
    image_url: Optional[str] = None


class BatchIndexRequest(BaseModel):
    assets: list[AssetPayload]


class UserRecommendationRequest(BaseModel):
    asset_ids: list[str]   # purchased or recently viewed asset IDs
    limit: Optional[int] = 10
    exclude_ids: Optional[list[str]] = []  # IDs to exclude from results
