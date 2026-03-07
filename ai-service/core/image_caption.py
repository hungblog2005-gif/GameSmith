import io
import base64
import logging

from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger(__name__)

_processor = None
_caption_model = None
CAPTION_MODEL_NAME = "Salesforce/blip-image-captioning-base"


def _ensure_loaded() -> None:
    global _processor, _caption_model
    if _caption_model is not None:
        return
    logger.info("Loading image captioning model: %s", CAPTION_MODEL_NAME)
    _processor = BlipProcessor.from_pretrained(CAPTION_MODEL_NAME)
    _caption_model = BlipForConditionalGeneration.from_pretrained(CAPTION_MODEL_NAME)
    _caption_model.eval()
    logger.info("Image captioning model loaded.")


def caption_from_base64(image_base64: str) -> str:
    """Decode a base64 image and generate a descriptive caption using BLIP."""
    _ensure_loaded()
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = _processor(image, return_tensors="pt")
    out = _caption_model.generate(**inputs, max_new_tokens=50)
    caption = _processor.decode(out[0], skip_special_tokens=True)
    logger.info("Generated caption: %s", caption)
    return caption
