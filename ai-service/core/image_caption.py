import io
import base64
import logging

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

_processor = None
_caption_model = None
CAPTION_MODEL_NAME = "Salesforce/blip-image-captioning-base"
_load_failed = False  # avoid retrying after a hard failure


def _ensure_loaded() -> bool:
    """Load BLIP model lazily. Returns False if unavailable."""
    global _processor, _caption_model, _load_failed
    if _caption_model is not None:
        return True
    if _load_failed:
        return False
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        logger.info("Loading image captioning model: %s", CAPTION_MODEL_NAME)
        _processor = BlipProcessor.from_pretrained(CAPTION_MODEL_NAME)
        _caption_model = BlipForConditionalGeneration.from_pretrained(CAPTION_MODEL_NAME)
        _caption_model.eval()
        logger.info("Image captioning model loaded.")
        return True
    except Exception as exc:
        logger.warning("BLIP model unavailable (will skip captioning): %s", exc)
        _load_failed = True
        return False


def caption_from_base64(image_base64: str) -> str:
    """Decode a base64 image and generate a descriptive caption using BLIP.

    Returns empty string if BLIP is unavailable or captioning fails.
    """
    if not _ensure_loaded():
        return ""
    try:
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # Ensure minimum size — tiny images (< 32px) can cause normalization errors
        min_size = 32
        if image.width < min_size or image.height < min_size:
            image = image.resize(
                (max(image.width, min_size), max(image.height, min_size)),
                Image.LANCZOS,
            )
        # Pass as numpy array to avoid PIL→tensor mode mismatches across transformers versions
        image_np = np.array(image)  # shape (H, W, 3) uint8
        inputs = _processor(images=image_np, return_tensors="pt")
        out = _caption_model.generate(**inputs, max_new_tokens=50)
        caption = _processor.decode(out[0], skip_special_tokens=True)
        logger.info("Generated caption: %s", caption)
        return caption
    except Exception as exc:
        logger.warning("Caption generation failed: %s", exc)
        return ""
