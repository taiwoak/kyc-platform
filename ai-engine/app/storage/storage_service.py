from __future__ import annotations

import logging
import uuid

from app.storage.minio_client import MinioClient

logger = logging.getLogger(__name__)

_client: MinioClient | None = None


def _get_client() -> MinioClient:
    global _client
    if _client is None:
        try:
            _client = MinioClient()
        except Exception as exc:  # noqa: BLE001
            logger.warning("MinIO client init failed (running without object storage): %s", exc)
            return None  # type: ignore[return-value]
    return _client


def store_document(data: bytes, prefix: str = "ai-processed", ext: str = "jpg") -> str | None:
    """Upload processed image bytes to MinIO, return the object key or None on failure."""
    client = _get_client()
    if client is None:
        return None
    object_key = f"{prefix}/{uuid.uuid4()}.{ext}"
    try:
        return client.put_object(object_key, data, content_type=f"image/{ext}")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to store document in MinIO: %s", exc)
        return None
