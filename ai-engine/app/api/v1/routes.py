from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status

from app.config.settings import settings
from app.schemas.verification import (
    DocumentAnalysisResponse,
    FaceVerificationResponse,
    LivenessResponse,
    OcrResponse,
    VerificationResponse,
)
from app.services.verification_service import VerificationService

router = APIRouter()
service = VerificationService()


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid AI Engine API key",
        )


@router.get("/health")
def health() -> dict[str, str]:
    return {"service": settings.service_name, "status": "healthy"}


@router.post("/ocr", response_model=OcrResponse, dependencies=[Depends(require_api_key)])
async def extract_ocr(document_file: UploadFile = File(...)) -> OcrResponse:
    return await service.ocr(document_file)


@router.post(
    "/document/analyze",
    response_model=DocumentAnalysisResponse,
    dependencies=[Depends(require_api_key)],
)
async def analyze_document(
    document_type: str = Form(default="NIN_SLIP"),
    document_file: UploadFile = File(...),
) -> DocumentAnalysisResponse:
    return await service.analyze_document(document_file, document_type)


@router.post(
    "/face/verify",
    response_model=FaceVerificationResponse,
    dependencies=[Depends(require_api_key)],
)
async def verify_face(
    document_file: UploadFile = File(...),
    selfie_file: UploadFile = File(...),
) -> FaceVerificationResponse:
    return await service.verify_face(document_file, selfie_file)


@router.post(
    "/liveness/check",
    response_model=LivenessResponse,
    dependencies=[Depends(require_api_key)],
)
async def check_liveness(selfie_file: UploadFile = File(...)) -> LivenessResponse:
    return await service.check_liveness(selfie_file)


@router.post("/verify-from-bytes", response_model=VerificationResponse, dependencies=[Depends(require_api_key)])
async def verify_from_bytes(
    customer_id: str = Form(default="anonymous"),
    document_file: UploadFile = File(...),
    selfie_file: UploadFile = File(...),
) -> VerificationResponse:
    return await service.verify_from_bytes(document_file, selfie_file, customer_id)


@router.post("/verify", response_model=VerificationResponse, dependencies=[Depends(require_api_key)])
async def verify_identity(
    document_type: str = Form(default="NIN_SLIP"),
    customer_id: str = Form(default="anonymous"),
    declared_document_number: str | None = Form(default=None),
    document_file: UploadFile = File(...),
    selfie_file: UploadFile = File(...),
) -> VerificationResponse:
    return await service.verify(document_file, selfie_file, document_type, customer_id, declared_document_number)
