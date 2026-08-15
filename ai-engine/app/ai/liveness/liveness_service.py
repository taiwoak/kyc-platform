from __future__ import annotations

import cv2
import numpy as np
from PIL import Image

from app.schemas.verification import LivenessResponse
from app.utils.images import image_quality


class LivenessService:
    """Passive liveness service using OpenCV texture analysis."""

    def check(self, selfie: Image.Image) -> LivenessResponse:
        quality = image_quality(selfie)
        score = quality.score
        anomalies = list(quality.anomalies)

        aspect_ratio = selfie.width / max(selfie.height, 1)
        if quality.entropy < 4.0:
            score -= 12.0
            anomalies.append("Low texture variation may indicate a replay or printed image")
        if quality.contrast < 30:
            score -= 8.0
            anomalies.append("Low contrast weakens passive liveness evidence")
        if aspect_ratio < 0.55 or aspect_ratio > 1.9:
            score -= 8.0
            anomalies.append("Selfie framing is unusual for a live face capture")
        if quality.sharpness > 95 and quality.entropy < 5.0:
            score -= 8.0
            anomalies.append("Over-sharp edges with low detail may indicate screen recapture")

        # OpenCV-based gradient texture analysis (LBP-inspired)
        lbp_score = self._lbp_uniformity(selfie)
        if lbp_score < 0.15:
            score -= 10.0
            anomalies.append("Gradient texture uniformity suggests a flat/printed surface")

        score = max(0.0, min(100.0, round(score, 2)))
        if score >= 70:
            status = "PASSED"
        elif score < 45:
            status = "FAILED"
        else:
            status = "INCONCLUSIVE"

        return LivenessResponse(
            status=status,
            liveness_score=score,
            detected_anomalies=anomalies,
            checks={
                "width": quality.width,
                "height": quality.height,
                "brightness": round(quality.brightness, 2),
                "contrast": round(quality.contrast, 2),
                "sharpness": round(quality.sharpness, 2),
                "entropy": round(quality.entropy, 2),
                "aspect_ratio": round(aspect_ratio, 2),
                "lbp_uniformity": round(lbp_score, 4),
            },
        )

    def _lbp_uniformity(self, image: Image.Image) -> float:
        """Simplified local binary pattern uniformity as a liveness cue."""
        gray = cv2.cvtColor(np.asarray(image.convert("RGB")), cv2.COLOR_RGB2GRAY)
        # Compute Sobel gradients as proxy for texture richness
        gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        magnitude = np.sqrt(gx ** 2 + gy ** 2)
        # Uniformity: fraction of pixels with gradient > threshold
        return float(np.mean(magnitude > 10.0))
