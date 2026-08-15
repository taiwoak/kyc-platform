from app.ai.verification.decision_engine import DecisionEngine
from app.schemas.verification import (
    DocumentAnalysisResponse,
    ExtractedDocument,
    FaceVerificationResponse,
    LivenessResponse,
    OcrResponse,
)


def test_decision_engine_verifies_high_confidence_payload():
    response = DecisionEngine().decide(
        customer_id="customer-1",
        ocr=OcrResponse(
            confidence_score=92,
            extracted_text="Name: Taiwo Akerele NIN: 12345678901",
            extracted_fields=ExtractedDocument(full_name="Taiwo Akerele", document_number="12345678901"),
        ),
        document=DocumentAnalysisResponse(
            status="VALID",
            authenticity_score=91,
            document_type="NIN_SLIP",
            quality_score=90,
        ),
        face=FaceVerificationResponse(status="MATCH", similarity_score=88, confidence_score=88),
        liveness=LivenessResponse(status="PASSED", liveness_score=86),
    )

    assert response.status == "VERIFIED"
    assert response.confidence_score >= 80


def test_decision_engine_rejects_critical_liveness_failure():
    response = DecisionEngine().decide(
        customer_id="customer-2",
        ocr=OcrResponse(confidence_score=90, extracted_text="NIN: 12345678901", extracted_fields=ExtractedDocument(document_number="12345678901")),
        document=DocumentAnalysisResponse(status="VALID", authenticity_score=90, document_type="NIN_SLIP", quality_score=90),
        face=FaceVerificationResponse(status="MATCH", similarity_score=89, confidence_score=89),
        liveness=LivenessResponse(status="FAILED", liveness_score=30),
    )

    assert response.status == "REJECTED"
