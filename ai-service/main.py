"""
GameSmith AI Recommendation Service
Entry point -- wires together config, core singletons, and routers.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from core.clip_embeddings import load_clip_model
from core.embeddings import load_model
from core.qdrant import init_qdrant
from routers import health, indexing, image_search, recommendations, similar, tagging, seo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        load_model()       # multilingual sentence-transformer (384-dim)
    except Exception as exc:
        logger.warning("Text model failed to load at startup (will retry on first use): %s", exc)
    try:
        load_clip_model()  # CLIP visual model (512-dim)
    except Exception as exc:
        logger.warning("CLIP model failed to load at startup (will retry on first use): %s", exc)
    try:
        init_qdrant()  # ensures both text + visual collections exist
    except Exception as exc:
        logger.warning("Qdrant unavailable at startup — search/indexing disabled: %s", exc)
    yield
    logger.info("AI service shutting down.")


app = FastAPI(title="GameSmith AI Recommendation Service", lifespan=lifespan)

app.include_router(health.router)
app.include_router(indexing.router)
app.include_router(similar.router)
app.include_router(image_search.router)
app.include_router(recommendations.router)
app.include_router(tagging.router)
app.include_router(seo.router)
