from __future__ import annotations

import logging

from fastapi import UploadFile

from app.ai.face.face_service import FaceService
from app.ai.liveness.liveness_service import LivenessService
from app.ai.ocr.ocr_service import OcrService
from app.ai.preprocessing.image_preprocessor import ImagePreprocessor
from app.ai.verification.decision_engine import DecisionEngine
from app.ai.verification.document_verifier import DocumentVerifier
from app.schemas.verification import (
    DocumentAnalysisResponse,
    FaceVerificationResponse,
    LivenessResponse,
    OcrResponse,
    VerificationResponse,
)
from app.storage import storage_service
from app.utils.images import image_quality, load_image, read_upload

logger = logging.getLogger(__name__)


class VerificationService:
    def __init__(self) -> None:
        self.preprocessor = ImagePreprocessor()
        self.ocr_service = OcrService()
        self.document_verifier = DocumentVerifier()
        self.face_service = FaceService()
        self.liveness_service = LivenessService()
        self.decision_engine = DecisionEngine()

    async def ocr(self, document_file: UploadFile) -> OcrResponse:
        document = load_image(await read_upload(document_file))
        prepared = self.preprocessor.prepare_document(document)
        return self.ocr_service.extract(prepared)

    async def analyze_document(self, document_file: UploadFile, document_type: str) -> DocumentAnalysisResponse:
        document = load_image(await read_upload(document_file))
        prepared = self.preprocessor.prepare_document(document)
        ocr_result = self.ocr_service.extract(prepared, document_type=document_type)
        quality = image_quality(prepared)
        return self.document_verifier.analyze(prepared, document_type, quality, ocr_result)

    async def verify_face(self, document_file: UploadFile, selfie_file: UploadFile) -> FaceVerificationResponse:
        document = self.preprocessor.prepare_document(load_image(await read_upload(document_file)))
        selfie = self.preprocessor.prepare_face(load_image(await read_upload(selfie_file)))
        return self.face_service.verify(document, selfie)

    async def check_liveness(self, selfie_file: UploadFile) -> LivenessResponse:
        selfie = self.preprocessor.prepare_face(load_image(await read_upload(selfie_file)))
        return self.liveness_service.check(selfie)

    async def verify(
        self,
        document_file: UploadFile,
        selfie_file: UploadFile,
        document_type: str,
        customer_id: str,
        declared_document_number: str | None = None,
    ) -> VerificationResponse:
        document_bytes = await read_upload(document_file)
        selfie_bytes = await read_upload(selfie_file)

        document = self.preprocessor.prepare_document(load_image(document_bytes))
        selfie = self.preprocessor.prepare_face(load_image(selfie_bytes))

        # Store originals in MinIO (best-effort, non-blocking)
        storage_service.store_document(document_bytes, prefix=f"ai-input/{customer_id}/documents", ext="jpg")
        storage_service.store_document(selfie_bytes, prefix=f"ai-input/{customer_id}/selfies", ext="jpg")

        ocr_result = self.ocr_service.extract(document, declared_document_number, document_type)
        document_result = self.document_verifier.analyze(
            document,
            document_type,
            image_quality(document),
            ocr_result,
        )
        face_result = self.face_service.verify(document, selfie)
        liveness_result = self.liveness_service.check(selfie)

        return self.decision_engine.decide(
            customer_id=customer_id,
            ocr=ocr_result,
            document=document_result,
            face=face_result,
            liveness=liveness_result,
        )

    async def verify_from_bytes(
        self,
        document_file: UploadFile,
        selfie_file: UploadFile,
        customer_id: str,
    ) -> VerificationResponse:
        document_bytes = await read_upload(document_file)
        selfie_bytes = await read_upload(selfie_file)

        document = self.preprocessor.prepare_document(load_image(document_bytes))
        selfie = self.preprocessor.prepare_face(load_image(selfie_bytes))

        # Store originals in MinIO (best-effort, non-blocking)
        storage_service.store_document(document_bytes, prefix=f"ai-input/{customer_id}/nin-documents", ext="jpg")
        storage_service.store_document(selfie_bytes, prefix=f"ai-input/{customer_id}/selfies", ext="jpg")

        # Mock an OCR result since we already have the data
        from app.schemas.verification import OcrResponse, ExtractedDocument
        ocr_result = OcrResponse(
            status="SUCCESS",
            confidence_score=100.0,
            extracted_text="MOCK_NIN_BIOMETRIC_DATA",
            extracted_fields=ExtractedDocument(),
            anomalies=[],
            engine="mock",
            field_sources={},
        )

        # Mock a perfect document score since we bypassed OCR
        from app.schemas.verification import DocumentAnalysisResponse
        document_result = DocumentAnalysisResponse(
            status="VALID",
            authenticity_score=100.0,
            document_type="NIN_BIOMETRIC",
            quality_score=100.0,
            detected_anomalies=[],
            checks={},
        )

        face_result = self.face_service.verify(document, selfie)
        liveness_result = self.liveness_service.check(selfie)

        return self.decision_engine.decide(
            customer_id=customer_id,
            ocr=ocr_result,
            document=document_result,
            face=face_result,
            liveness=liveness_result,
        )
