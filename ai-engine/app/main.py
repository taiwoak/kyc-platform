from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import router as api_router
from app.config.settings import settings

app = FastAPI(
    title="KYC AI Verification Engine",
    version="0.1.0",
    description="OCR, document verification, face comparison, liveness, and decision APIs.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "kyc-ai-engine", "status": "online"}
