# API Notes

## Backend API

Base URL: `http://localhost:3000/api`

| Endpoint | Method | Role | Purpose |
| --- | --- | --- | --- |
| `/auth/register` | `POST` | Public | Create a customer account and return a JWT |
| `/auth/login` | `POST` | Public | Authenticate and return a JWT |
| `/verification/requests` | `POST` | Authenticated | Submit `document` and `selfie` files for verification |
| `/verification/history` | `GET` | Authenticated | List the signed-in customer's verification records |
| `/verification/reviews` | `GET` | Officer, compliance officer, admin | List records requiring manual review |
| `/verification/all` | `GET` | Admin | List all verification records |
| `/users` | `GET` | Admin | List platform users |
| `/audit` | `GET` | Admin | List audit events |

Swagger UI is exposed at `http://localhost:3000/api/docs`.

## AI Engine API

Base URL: `http://localhost:8000/api/v1`

Protected endpoints require the `x-api-key` header.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/health` | `GET` | Health check |
| `/ocr` | `POST` | OCR extraction from an uploaded document |
| `/document/analyze` | `POST` | Document quality and authenticity scoring |
| `/face/verify` | `POST` | Compare document portrait and selfie |
| `/liveness/check` | `POST` | Passive selfie liveness check |
| `/verify` | `POST` | Full multi-modal verification workflow |
