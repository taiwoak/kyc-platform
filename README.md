# KYC Platform – Local Demo Deployment Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | ≥ 20 LTS | https://nodejs.org |
| Python | ≥ 3.11 | https://python.org |
| Tesseract OCR | ≥ 5.x | `choco install tesseract` (Windows) or [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) |

---

## Step 1 – Start PostgreSQL and MinIO (Docker)

```powershell
# From the project root
docker compose -f deployment/docker-compose.yml up postgres minio -d
```

- PostgreSQL available at `localhost:5432` (auto-creates tables via TypeORM synchronize)
- MinIO S3 API at `localhost:9000`
- MinIO Console at `http://localhost:9001` (login: `minioadmin` / `minioadmin`)

---

## Step 2 – Set up Python virtual environment and install AI dependencies

```powershell
python -m venv ai-engine/.venv
ai-engine/.venv/Scripts/pip install -r ai-engine/requirements.txt
```

On first run, InsightFace will download the `buffalo_sc` model weights (~100 MB).

---

## Step 3 – Install Node.js dependencies

```powershell
npm install
```

---

## Step 4 – Configure environment variables

Copy the example file (already populated with local demo defaults):

```powershell
Copy-Item .env.example .env
```

---

## Step 5 – Start all services

**Terminal 1 – AI Engine (Python FastAPI)**
```powershell
ai-engine/.venv/Scripts/uvicorn app.main:app --app-dir ai-engine --reload --port 8000
```

**Terminal 2 – Backend (NestJS)**
```powershell
npm run dev:backend
```

**Terminal 3 – Frontend (Vite React)**
```powershell
npm run dev:frontend
```

---

## Step 6 – Access the demo

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
