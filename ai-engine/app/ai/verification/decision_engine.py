from app.config.settings import settings
from app.schemas.verification import (
    DocumentAnalysisResponse,
    FaceVerificationResponse,
    LivenessResponse,
    OcrResponse,
    VerificationResponse,
)


class DecisionEngine:
    weights = {
        "ocr": 0.2,
        "document": 0.25,
        "face": 0.35,
        "liveness": 0.2,
    }

    def decide(
        self,
        customer_id: str,
        ocr: OcrResponse,
        document: DocumentAnalysisResponse,
        face: FaceVerificationResponse,
        liveness: LivenessResponse,
    ) -> VerificationResponse:
        module_scores = {
            "ocr": ocr.confidence_score,
            "document": document.authenticity_score,
            "face": face.confidence_score,
            "liveness": liveness.liveness_score,
        }
        confidence = round(
            sum(module_scores[key] * self.weights[key] for key in self.weights),
            2,
        )
        anomalies = [
            *ocr.anomalies,
            *document.detected_anomalies,
            *face.detected_anomalies,
            *liveness.detected_anomalies,
        ]

        critical_failure = (
            ocr.status == "FAILED"
            or document.status == "LOW_QUALITY"
            or face.status == "FACE_NOT_FOUND"
            or liveness.status == "FAILED"
        )

        if critical_failure or confidence < settings.rejected_threshold:
            decision = "REJECTED"
        elif confidence >= settings.verified_threshold and face.status == "MATCH" and liveness.status == "PASSED":
            decision = "VERIFIED"
        else:
            decision = "MANUAL_REVIEW_REQUIRED"

        return VerificationResponse(
            customer_id=customer_id,
            status=decision,
            confidence_score=confidence,
            ocr_status=ocr.status,
            document_authenticity=document.status,
            face_similarity=face.similarity_score,
            liveness_status=liveness.status,
            extracted_fields=ocr.extracted_fields,
            detected_anomalies=anomalies,
            module_scores=module_scores,
            metadata={
                "decision_policy": "weighted_multi_modal_v1",
                "ocr_engine": ocr.engine,
                "field_sources": ocr.field_sources,
                "face_method": face.method,
                "document_checks": document.checks,
                "liveness_checks": liveness.checks,
                "review_notes": self._review_notes(decision, anomalies),
            },
        )

    def _review_notes(self, decision: str, anomalies: list[str]) -> list[str]:
        if decision == "VERIFIED":
            return ["All weighted local verification checks met the approval threshold"]
        if decision == "REJECTED":
            return ["One or more critical local verification checks failed", *anomalies[:3]]
        return ["Supervisor/officer review is recommended before approval", *anomalies[:3]]
