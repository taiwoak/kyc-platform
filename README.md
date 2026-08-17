# KYC Platform – Local Demo Deployment Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | ≥ 20 LTS | https://nodejs.org |
| Python | ≥ 3.11 | https://python.org |
| Tesseract OCR | ≥ 5.x | `choco install tesseract` (Windows) or [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) |

---

## Step 1 – Start all services (Fully Dockerized)

The entire platform (PostgreSQL, MinIO, AI Engine, Backend, and Frontend) is orchestrated via Docker Compose.

```powershell
# From the project root
docker compose -f deployment/docker-compose.yml up --build -d
```

Wait a few moments for all containers to build and start. The AI Engine will automatically download the `buffalo_sc` model weights (~100 MB) on its first run inside the container.

---

## Step 2 – Configure environment variables (Optional for local dev)

If you want to run services outside of Docker for development, copy the example file:

```powershell
Copy-Item .env.example .env
```

---

## Step 3 – Access the demo

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API docs (Swagger)** | http://localhost:3000/api/docs |
| **AI Engine API docs** | http://localhost:8000/docs |
| **MinIO Console** | http://localhost:9001 |

---

## Demo Credentials (seeded on startup)

| Role | Email | Password |
|---|---|---|
| Customer | `customer@kyc.local` | `Password123!` |
| KYC Officer | `officer@kyc.local` | `Password123!` |
| Admin | `admin@kyc.local` | `Password123!` |

---

## Supported Document Types

The platform supports identity verification using documents that contain a portrait photo and biodata:
- **NIN Slip** (National Identity Number)
- **International Passport**
- **Driver's License**
- **Voter's Card**

---

## Demo Scenarios

### Scenario A: Full Document Verification (OCR + Face Match)
1. Login as **customer@kyc.local**
2. Click **Verify Identity** in the sidebar
3. Select **Identity Document** mode and choose one of the supported documents (e.g., International Passport)
4. Upload your document image
5. Click **Open Camera** → allow camera access → position face → **Capture Face**
6. Click **Submit for Verification**
7. View the result page showing AI decisions, OCR fields, and Module scores (OCR, Document, Face Match, Liveness)

### Scenario B: NIN Biometric Verification (Mock API + Face Match)
*Note: This flow demonstrates bypassing traditional OCR by directly querying a national identity database.*
1. Login as **customer@kyc.local**
2. Click **Verify Identity** in the sidebar
3. Switch the toggle to **NIN Biometric** mode
4. Enter the mock NIN: `00000000001` (other inputs will simulate a failed lookup)
5. Capture a live selfie
6. Click **Submit for Verification**
7. View the result page (Notice that OCR and Document scores are hidden, as the data is retrieved directly from the mock database).

### Platform Administration
8. Login as **officer@kyc.local** to see the manual-review queue for edge cases.
9. Login as **admin@kyc.local** to see all verifications and audit logs.
10. Check MinIO at http://localhost:9001 → `kyc-documents` bucket to see uploaded files.
11. Connect a PostgreSQL client to `localhost:5432/kyc_platform` to inspect the database.

---

## Future Enhancements
- **Live NIN API Integration**: The current NIN Biometric flow uses a mock service to simulate retrieving biodata and a baseline photo. The backend `NinMockService` is designed to be easily swappable with a live integration to a national identity API (like NIMC in Nigeria) without changing the core AI facial comparison logic.

---

## Technology Stack

| Layer | Tool | Purpose |
|---|---|---|
| Frontend | React + TypeScript (Vite) | Customer UI, webcam capture, result display |
| Backend | NestJS + TypeScript | Auth, RBAC, orchestration, audit |
| Database | **PostgreSQL 16** (TypeORM) | Persistent users, verifications, audit events |
| Object Storage | **MinIO** | Documents and selfie images |
| AI Engine | FastAPI + Python | OCR, face match, liveness |
| OCR | **Tesseract 5** + pytesseract | NIN text extraction with OpenCV preprocessing |
| Image Processing | **OpenCV** (cv2) | CLAHE enhancement, deskew, adaptive threshold |
| Face Recognition | **InsightFace** (ArcFace) | Embedding-based face comparison |
| Liveness | OpenCV gradient analysis | Passive anti-spoofing |
