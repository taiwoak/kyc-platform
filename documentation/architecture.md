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

The platform supports two parallel verification paradigms:

**Path A: Full Document Verification**
1. Customer signs in and submits a supported identity document (NIN Slip, International Passport, Driver's License, or Voter's Card) plus a live selfie.
2. The frontend sends a multipart request to `POST /api/verification/requests`.
3. The backend stores the uploaded files in MinIO and calls the AI engine's `POST /verify` endpoint.
4. The AI engine executes OCR, document quality/authenticity checks, face comparison, and liveness scoring.

**Path B: NIN Biometric Verification (Bypass Flow)**
1. Customer selects NIN Biometric mode, enters their NIN string, and captures a live selfie.
2. The frontend sends the request to `POST /api/verification/nin-verify`.
3. The backend retrieves the enrolled baseline photo and biodata from the `NinMockService`.
4. The backend sends the baseline photo bytes and live selfie directly to the AI Engine's `POST /verify-from-bytes` endpoint.
5. The AI engine bypasses OCR and document checks, performing only Face Comparison and Liveness Scoring.

**Result Handling (Both Paths)**
1. The backend stores the final aggregated result and records audit events.
2. Customers view their result (dynamically hiding OCR/Document scores if Path B was used).
3. Officers review edge cases that fell into `MANUAL_REVIEW`.
4. Admins monitor overall platform usage and audit activity.

## Design Rationale

The AI engine is deployable independently from the business platform. This keeps model evolution, inference scaling, and future integrations isolated from customer workflow code. The backend remains the only service exposed to the frontend for protected business operations, which centralizes authentication, role checks, validation, and audit logging.

## Future Enhancements
* **Live Identity Integration:** The `NinMockService` currently acts as a stand-in for a live national identity database. The architecture is explicitly designed so that this mock service can be transparently swapped with a live API integration (e.g., NIMC). The backend will fetch the real baseline photo using the provided NIN and pass it to the AI engine for the exact same facial comparison logic, requiring zero changes to the AI layer.
