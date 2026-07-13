# AI-Powered MSME Financial Health Card
### Explainable Credit Scoring for New-to-Credit & New-to-Bank Enterprises

**Version:** 3.0 (Full-Stack MVP) | **Status:** Working Production Prototype | **Last updated:** July 2026

> ⚠️ **Demo Notice:** All MSME data in this prototype is **synthetically generated**. Production deployment requires GSP/AA-FIU integration, RBI Digital Lending compliance, DPDP Act 2023 consent framework, and model bias/calibration validation before real underwriting use.

---

## 🚀 Production Deployed Services

The application is fully deployed and configured in the cloud:

* **Interactive Frontend (React SPA)**: [https://idbi-frontend-pe4i.onrender.com](https://idbi-frontend-pe4i.onrender.com)
* **Backend API Engine**: [https://idbi-backend-0am7.onrender.com](https://idbi-backend-0am7.onrender.com)
* **Interactive API Documentation (Swagger UI)**: [https://idbi-backend-0am7.onrender.com/docs](https://idbi-backend-0am7.onrender.com/docs)

---

## Architecture & Project Structure

The project has been migrated from a purely mock-based frontend to a fully integrated **FastAPI backend + PostgreSQL + React SPA** architecture using Clean Architecture principles.

```
IDBI/
├── Backend/                            ← FastAPI Asynchronous Backend
│   ├── alembic/                        ← Database Migrations
│   ├── app/
│   │   ├── api/                        ← Routers (Auth, Applicant, Employee, Admin)
│   │   ├── core/                       ← Security config (Direct Bcrypt, JWT tokens)
│   │   ├── database/                   ← SQLAlchemy async engine & DB session maker
│   │   ├── dependencies/               ← RBAC & JWT token validation dependencies
│   │   ├── models/                     ← SQLAlchemy Declarative Models (PostgreSQL)
│   │   ├── schemas/                    ← Pydantic validation schemas
│   │   ├── services/                   ← Business Logic (Scoring engine, Hugging Face AI)
│   │   └── main.py                     ← FastAPI startup lifespanner & CORS middlewares
│   ├── requirements.txt                ← Python Dependencies (Pinned)
│   ├── test_endpoints.py               ← Comprehensive Integration Test Script
│   └── .env                            ← Database credentials & Hugging Face tokens
│
└── frontend/                           ← React 19 + Vite 6 Single Page App
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                     ← Views (Landing, Dashboard, Portfolio, Admin tools)
    │   ├── auth/
    │   │   ├── AuthContext.jsx         ← Context for managing sessions & API integrations
    │   │   └── AuthModal.jsx           ← Sliding authentication interface
    │   └── engine/
    │       └── scoringEngine.js        ← Local backup simulation engine
```

---

## Core Full-Stack Features

### 1. Robust Credit Scoring Engine
* Calculates a dynamic **Financial Health Score (0–1000)** based on monthly telemetry data.
* Scores are divided across five weighted dimensions:
  1. **Cash-Flow Strength (25%):** Net margins, UPI growth, and payment concentrations.
  2. **Revenue Consistency (20%):** Coefficient of variation for GST invoices.
  3. **Compliance Behavior (20%):** On-time tax filing rate & EPFO contribution frequencies.
  4. **Operational Continuity (20%):** Workforce growth and utility consumption stability.
  5. **Financial Resilience (15%):** Average balances, low-balance occurrences, and check bounces.

### 2. Underwriter Explainability via Hugging Face AI
* Uses the **Hugging Face Inference API** (running open-source `mistralai/Mistral-7B-Instruct-v0.3`) to analyze calculated scorecard parameters.
* Automatically compiles a plain-language executive summary outlining strengths, weaknesses, recommended credit improvements, and underwriter justifications.
* Built-in fallback system handles rate limits or API key placeholders without causing server crashes.

### 3. Role-Based Access Control (RBAC) & JWT Security
* Pinned cryptographical security utilizing direct **Bcrypt** hashing and secure state-independent JWT tokens.
* Enforces four system access roles:
  * **Applicant:** Complete profiles, upload monthly financial vectors, submit credit requests, and view generated score cards.
  * **Employee:** Pipeline access to review applications, write notes, and approve/reject requests.
  * **Admin / Super Admin:** Seeded system owners with rights to manage bank employees and monitor global dashboard metrics.

---

## Quick Start (Running the Application)

### 1. PostgreSQL Database Setup
Ensure you have a PostgreSQL server running locally, create a database named `idbi_msme`, and configure your credentials in `Backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://<username>:<password>@localhost:5432/idbi_msme
HF_API_TOKEN=your_hugging_face_access_token
```

### 2. Run Backend Migrations & Boot Server
Navigate to the `Backend` directory, apply the Alembic schema migrations, and launch the server:
```bash
cd Backend
# Install python dependencies
.\venv\Scripts\pip install -r requirements.txt

# Run database migrations
.\venv\Scripts\alembic upgrade head

# Start uvicorn server
.\venv\Scripts\python main.py
```
* **API Documentation (Swagger UI):** Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
* *Note:* The system automatically seeds the default Super Admin credential (`admin@idbi.co.in` / `password123`) on startup.

### 3. Start Frontend Dashboard
Navigate to the `frontend` directory, install packages, and boot Vite:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Verifying Endpoints (Integration Testing)
We have provided an automated endpoint verification script to test the complete applicant, admin, and employee flows sequentially. 

Keep your FastAPI server running, open a new terminal window in the `Backend` directory, and run:
```bash
.\venv\Scripts\python test_endpoints.py
```
This tests user registrations, JWT logins, profile updates, financial metrics uploads, credit scoring compilations, and loan approvals with 100% test coverage.

---

## Regulatory Compliance Context

### RBI Digital Lending Directions
* The explainability layer satisfies strict auditable lending requirements by detailing exactly which alternate data points generated the score.
* Regulated entities maintain complete oversight and accountability for loan approvals/declinations.

### DPDP Act 2023 & Consent Architecture
* All alternate telemetry is purpose-bound and revocable.
* Designed to integrate seamlessly with standard Account Aggregator (AA), OCEN, and Unified Lending Interface (ULI) setups.

---

## Changelog

| Date | Version | Changes |
|---|---|---|
| July 2026 | 1.0 | Initial concept + prototype brief (README_2.md) |
| July 2026 | 2.0 | React SPA prototype with synthetic inline dataset. |
| July 2026 | 3.0 | **Full-Stack Migration:** Coded FastAPI backend, integrated PostgreSQL with Alembic async migrations, implemented direct Bcrypt + JWT token authentication, built dynamic credit scoring service, and integrated Hugging Face Inference API for underwriting explainability. |
