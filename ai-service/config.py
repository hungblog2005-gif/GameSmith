import os
from dotenv import load_dotenv

load_dotenv()

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "game_assets")
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
VECTOR_SIZE = 384  # paraphrase-multilingual-MiniLM-L12-v2 output dimension (same as all-MiniLM-L6-v2)

# Visual (CLIP) collection — separate from text collection
VISUAL_COLLECTION_NAME = os.getenv("QDRANT_VISUAL_COLLECTION", "game_assets_visual")
CLIP_VECTOR_SIZE = 512  # clip-ViT-B-32 output dimension

# Backend URL (used by ai-service to download asset images for indexing)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
