from PIL import Image

from app.models.domain import ImageQuality
from app.schemas.verification import DocumentAnalysisResponse, OcrResponse


class DocumentVerifier:
    supported_types = {"NIN_SLIP", "DRIVERS_LICENSE", "PVC", "PASSPORT"}

    def analyze(self, image: Image.Image, document_type: str, quality: ImageQuality, ocr: OcrResponse) -> DocumentAnalysisResponse:
        normalized_type = document_type.upper()
        anomalies = list(quality.anomalies) + list(ocr.anomalies)
        score = quality.score * 0.45 + ocr.confidence_score * 0.45 + 10.0

        if normalized_type not in self.supported_types:
            anomalies.append("Unsupported document type")
            score -= 20.0

        aspect_ratio = image.width / max(image.height, 1)
        if aspect_ratio < 1.1 or aspect_ratio > 2.3:
            anomalies.append("Document aspect ratio is unusual for supported identity documents")
            score -= 10.0

        if ocr.extracted_fields.document_number is None:
            anomalies.append("Mandatory identity number is missing")
            score -= 15.0

        score = max(0.0, min(100.0, round(score, 2)))
        if score >= 75:
            status = "VALID"
        elif score >= 50:
            status = "SUSPICIOUS"
        else:
            status = "LOW_QUALITY"

        return DocumentAnalysisResponse(
            status=status,
            authenticity_score=score,
            document_type=normalized_type,
            quality_score=round(quality.score, 2),
            detected_anomalies=anomalies,
            checks={
                "width": quality.width,
                "height": quality.height,
                "brightness": round(quality.brightness, 2),
                "contrast": round(quality.contrast, 2),
                "sharpness": round(quality.sharpness, 2),
                "entropy": round(quality.entropy, 2),
                "aspect_ratio": round(aspect_ratio, 2),
                "ocr_engine": ocr.engine,
            },
        )
