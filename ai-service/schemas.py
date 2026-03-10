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
    # Primary thumbnail URL (used for CLIP visual indexing)
    image_url: Optional[str] = None
    # Additional preview image URLs — all are embedded and averaged for richer visual representation
    preview_urls: Optional[list[str]] = []


class BatchIndexRequest(BaseModel):
    assets: list[AssetPayload]


class UserRecommendationRequest(BaseModel):
    asset_ids: list[str]   # purchased or recently viewed asset IDs
    limit: Optional[int] = 10
    exclude_ids: Optional[list[str]] = []  # IDs to exclude from results


# ---------------------------------------------------------------------------
# Auto-Tagging
# ---------------------------------------------------------------------------

class TagSuggestRequest(BaseModel):
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category_name: Optional[str] = None
    file_names: Optional[list[str]] = []  # filenames/extensions from uploaded package


class TagSuggestion(BaseModel):
    tag: str
    group: str
    score: float


class TagSuggestResponse(BaseModel):
    suggested_tags: list[TagSuggestion]
    vocabulary: dict  # full grouped vocabulary


# ---------------------------------------------------------------------------
# SEO Generation
# ---------------------------------------------------------------------------

class SeoRequest(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = []
    file_format: Optional[list[str]] = []
    license_type: Optional[str] = None


class SeoResponse(BaseModel):
    title: str
    meta_description: str
    keywords: list[str]
    slug: str
    seo_description: str
    extra_tags: list[str]
