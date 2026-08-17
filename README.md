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

## Demo Flow

1. Login as **customer@kyc.local**
2. Click **Verify Identity** in the sidebar
3. Select document type **NIN Slip**
4. Upload your NIN slip image
5. Click **Open Camera** → allow camera access → position face → **Capture Face**
6. Click **Submit for Verification**
7. View the result page showing:
   - AI decision (VERIFIED / MANUAL_REVIEW / REJECTED)
   - OCR extracted fields (Name, DOB, Gender, NIN)
   - Module scores (OCR, Document, Face Match, Liveness)
   - Detected anomalies
8. Login as **officer@kyc.local** to see manual-review queue
9. Login as **admin@kyc.local** to see all verifications and audit log
10. Check MinIO at http://localhost:9001 → `kyc-documents` bucket to see uploaded files
11. Connect a PostgreSQL client to `localhost:5432/kyc_platform` to inspect the database

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
