from __future__ import annotations

import logging
from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.config.settings import settings

logger = logging.getLogger(__name__)


class MinioClient:
    """Thin wrapper around the MinIO Python SDK for the AI engine."""

    def __init__(self) -> None:
        self._client = Minio(
            f"{settings.minio_endpoint}:{settings.minio_port}",
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self._bucket = settings.minio_bucket
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self._client.bucket_exists(self._bucket):
                self._client.make_bucket(self._bucket)
                logger.info("Created MinIO bucket: %s", self._bucket)
        except S3Error as exc:
            logger.warning("Could not ensure MinIO bucket: %s", exc)

    def get_object_bytes(self, object_key: str) -> bytes:
        try:
            response = self._client.get_object(self._bucket, object_key)
            return response.read()
        except S3Error as exc:
            raise RuntimeError(f"MinIO get_object failed for {object_key}: {exc}") from exc

    def put_object(self, object_key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        try:
            self._client.put_object(
                self._bucket,
                object_key,
                BytesIO(data),
                len(data),
                content_type=content_type,
            )
            return object_key
        except S3Error as exc:
            raise RuntimeError(f"MinIO put_object failed for {object_key}: {exc}") from exc
