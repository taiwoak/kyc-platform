from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field

Decision = Literal["VERIFIED", "REJECTED", "MANUAL_REVIEW_REQUIRED"]


class ExtractedDocument(BaseModel):
    full_name: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    document_number: str | None = None
    expiry_date: str | None = None
    address: str | None = None


class OcrResponse(BaseModel):
    status: Literal["SUCCESS", "FAILED"] = "SUCCESS"
    confidence_score: float = Field(ge=0, le=100)
    extracted_text: str
    extracted_fields: ExtractedDocument
    anomalies: list[str] = Field(default_factory=list)
    engine: str = "heuristic"
    field_sources: dict[str, str] = Field(default_factory=dict)


class DocumentAnalysisResponse(BaseModel):
    status: Literal["VALID", "SUSPICIOUS", "LOW_QUALITY"]
    authenticity_score: float = Field(ge=0, le=100)
    document_type: str
    quality_score: float = Field(ge=0, le=100)
    detected_anomalies: list[str] = Field(default_factory=list)
    checks: dict[str, float | str] = Field(default_factory=dict)


class FaceVerificationResponse(BaseModel):
    status: Literal["MATCH", "NO_MATCH", "FACE_NOT_FOUND"]
    similarity_score: float = Field(ge=0, le=100)
    confidence_score: float = Field(ge=0, le=100)
    detected_anomalies: list[str] = Field(default_factory=list)
    method: str = "perceptual_portrait_similarity"


class LivenessResponse(BaseModel):
    status: Literal["PASSED", "FAILED", "INCONCLUSIVE"]
    liveness_score: float = Field(ge=0, le=100)
    detected_anomalies: list[str] = Field(default_factory=list)
    checks: dict[str, float | str] = Field(default_factory=dict)


class VerificationResponse(BaseModel):
    verification_id: str = Field(default_factory=lambda: f"VER-{uuid4().hex[:10].upper()}")
    customer_id: str
    status: Decision
    confidence_score: float = Field(ge=0, le=100)
    ocr_status: str
    document_authenticity: str
    face_similarity: float = Field(ge=0, le=100)
    liveness_status: str
    extracted_fields: ExtractedDocument
    detected_anomalies: list[str] = Field(default_factory=list)
    module_scores: dict[str, float]
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
