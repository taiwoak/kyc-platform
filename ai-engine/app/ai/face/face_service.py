from __future__ import annotations

import logging

import cv2
import numpy as np
from PIL import Image

from app.schemas.verification import FaceVerificationResponse

logger = logging.getLogger(__name__)

# InsightFace model is loaded once at module level (lazy)
_insightface_app: object | None = None
_insightface_loaded: bool = False


def _get_insightface():
    global _insightface_app, _insightface_loaded
    if _insightface_loaded:
        return _insightface_app
    _insightface_loaded = True
    try:
        import insightface
        from insightface.app import FaceAnalysis
        app = FaceAnalysis(
            name="buffalo_sc",
            providers=["CPUExecutionProvider"],
        )
        app.prepare(ctx_id=-1, det_size=(320, 320))
        _insightface_app = app
        logger.info("InsightFace ArcFace model loaded successfully")
    except Exception as exc:
        logger.warning("InsightFace not available, falling back to perceptual hash: %s", exc)
        _insightface_app = None
    return _insightface_app


class FaceService:
    """Face comparison service using InsightFace ArcFace embeddings with OpenCV Haar fallback."""

    def verify(self, document_image: Image.Image, selfie_image: Image.Image) -> FaceVerificationResponse:
        insight = _get_insightface()
        if insight is not None:
            return self._verify_insightface(document_image, selfie_image, insight)
        return self._verify_perceptual(document_image, selfie_image)

    # ──────────────────────────────────────────────────────────────────────────
    # InsightFace path (primary)
    # ──────────────────────────────────────────────────────────────────────────

    def _verify_insightface(self, document_image: Image.Image, selfie_image: Image.Image, app) -> FaceVerificationResponse:
        doc_faces = app.get(np.asarray(document_image))
        selfie_faces = app.get(np.asarray(selfie_image))
        anomalies: list[str] = []

        if not selfie_faces:
            return FaceVerificationResponse(
                status="FACE_NOT_FOUND",
                similarity_score=0.0,
                confidence_score=0.0,
                detected_anomalies=["InsightFace could not detect a face in the selfie"],
                method="insightface_arcface",
            )

        if not doc_faces:
            anomalies.append("InsightFace could not detect a portrait in the identity document; using heuristic crop")
            doc_embedding = self._embedding_from_crop(document_image, app, prefer_document_layout=True)
        else:
            largest_doc = max(doc_faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
            doc_embedding = largest_doc.normed_embedding

        largest_selfie = max(selfie_faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        selfie_embedding = largest_selfie.normed_embedding

        # Cosine similarity of L2-normed embeddings is just the dot product
        cosine_sim = float(np.dot(doc_embedding, selfie_embedding))
        # Scale: cosine in [-1,1] → percentage. Verified face pairs typically score > 0.25
        normalized = round(max(0.0, min(100.0, (cosine_sim + 1.0) / 2.0 * 100.0)), 2)

        if normalized < 50:
            anomalies.append("Face similarity is below the configured match threshold")

        status = "MATCH" if normalized >= 60.0 else "NO_MATCH"
        confidence = normalized if status == "MATCH" else max(0.0, normalized - 10.0)

        return FaceVerificationResponse(
            status=status,
            similarity_score=normalized,
            confidence_score=round(confidence, 2),
            detected_anomalies=anomalies,
            method="insightface_arcface",
        )

    def _embedding_from_crop(self, image: Image.Image, app, prefer_document_layout: bool) -> np.ndarray:
        crop = self._heuristic_crop(image, prefer_document_layout)
        faces = app.get(np.asarray(crop))
        if faces:
            return max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])).normed_embedding
        # Last resort: embed the entire cropped region
        result = app.get(np.asarray(image))
        if result:
            return result[0].normed_embedding
        # Zero embedding if nothing works
        return np.zeros(512, dtype=np.float32)

    # ──────────────────────────────────────────────────────────────────────────
    # Perceptual hash fallback (no InsightFace)
    # ──────────────────────────────────────────────────────────────────────────

    def _verify_perceptual(self, document_image: Image.Image, selfie_image: Image.Image) -> FaceVerificationResponse:
        document_face, document_method = self._portrait_crop(document_image, prefer_document_layout=True)
        selfie_face, selfie_method = self._portrait_crop(selfie_image, prefer_document_layout=False)

        if selfie_method == "not_found":
            return FaceVerificationResponse(
                status="FACE_NOT_FOUND",
                similarity_score=0.0,
                confidence_score=0.0,
                detected_anomalies=["No face-like region was detected in the selfie"],
                method="opencv_haar",
            )

        doc_vec = self._perceptual_vector(document_face)
        self_vec = self._perceptual_vector(selfie_face)
        similarity = float(np.dot(doc_vec, self_vec))
        normalized = round(max(0.0, min(100.0, 50.0 + max(similarity, -0.75) * 50.0)), 2)

        anomalies: list[str] = []
        if document_method == "heuristic_document_crop":
            anomalies.append("Document portrait was estimated from slip layout (no face detector available)")
        if selfie_method == "heuristic_selfie_crop":
            anomalies.append("Selfie face region was estimated from image center")
        if normalized < 45:
            anomalies.append("Face similarity is below the configured match threshold")

        status = "MATCH" if normalized >= 58.0 else "NO_MATCH"
        confidence = normalized if status == "MATCH" else max(0.0, normalized - 10.0)

        return FaceVerificationResponse(
            status=status,
            similarity_score=normalized,
            confidence_score=round(confidence, 2),
            detected_anomalies=anomalies,
            method=f"{document_method}+{selfie_method}",
        )

    def _portrait_crop(self, image: Image.Image, prefer_document_layout: bool) -> tuple[Image.Image, str]:
        detected = self._opencv_face_crop(image)
        if detected:
            return detected, "opencv_haar"
        return self._heuristic_crop(image, prefer_document_layout), (
            "heuristic_document_crop" if prefer_document_layout else "heuristic_selfie_crop"
        )

    def _heuristic_crop(self, image: Image.Image, prefer_document_layout: bool) -> Image.Image:
        width, height = image.size
        if prefer_document_layout:
            left = 0
            upper = int(height * 0.12)
            right = int(width * 0.46)
            lower = int(height * 0.9)
            return image.crop((left, upper, max(right, 1), max(lower, 1)))
        side = int(min(width, height) * 0.78)
        left = max(0, (width - side) // 2)
        upper = max(0, int(height * 0.08))
        return image.crop((left, upper, min(width, left + side), min(height, upper + side)))

    def _opencv_face_crop(self, image: Image.Image) -> Image.Image | None:
        gray = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2GRAY)
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        if cascade.empty():
            return None
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 50))
        if len(faces) == 0:
            return None
        x, y, width, height = max(faces, key=lambda face: face[2] * face[3])
        margin = int(max(width, height) * 0.25)
        left = max(0, x - margin)
        upper = max(0, y - margin)
        right = min(image.width, x + width + margin)
        lower = min(image.height, y + height + margin)
        return image.crop((left, upper, right, lower))

    def _perceptual_vector(self, image: Image.Image) -> np.ndarray:
        small = image.convert("L").resize((32, 32))
        vector = np.asarray(small, dtype=np.float32).flatten()
        vector = vector - vector.mean()
        norm = np.linalg.norm(vector)
        return vector / norm if norm else vector
