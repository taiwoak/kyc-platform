# Architecture Notes

The implementation follows the thesis architecture for an AI-driven multi-modal KYC verification system.

## Layers

| Layer | Implementation | Responsibility |
| --- | --- | --- |
| Presentation | `frontend/` React + TypeScript | Authentication screens, customer verification upload, result view, officer queue, admin analytics |
| Business | `backend/` NestJS + TypeScript | JWT auth, RBAC, verification workflow orchestration, audit events, AI engine integration |
| AI Processing | `ai-engine/` FastAPI + Python | OCR, document analysis, face comparison, liveness scoring, weighted decision policy |
| Data | Prototype adapters with PostgreSQL/MinIO deployment services | Structured metadata and object-storage-compatible media references |

## Verification Flow

1. Customer signs in and submits an identity document plus selfie.
2. The frontend sends a multipart request to `POST /api/verification/requests`.
3. The backend validates the JWT, stores uploaded files through the storage adapter, creates a verification record, and calls the AI engine.
4. The AI engine executes OCR, document quality/authenticity checks, face comparison, liveness scoring, and the decision engine.
5. The backend stores the completed result and records audit events.
6. Customers view their result, officers review manual-review cases, and admins monitor users/audit activity.

## Design Rationale

The AI engine is deployable independently from the business platform. This keeps model evolution, inference scaling, and future integrations isolated from customer workflow code. The backend remains the only service exposed to the frontend for protected business operations, which centralizes authentication, role checks, validation, and audit logging.
