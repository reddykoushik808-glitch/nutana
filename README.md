# NUTANA — Zero-Waste Grocery Intelligence Platform

**NUTANA** is a full-stack grocery inventory intelligence and zero-waste management platform engineered specifically for Indian kirana stores, mini-markets, bakeries, dairies, and general food stores.

NUTANA solves perishability risks, tracks stock using **First-Expiring, First-Out (FEFO)** allocation, powers cross-shop inventory discovery (without maps), and leverages a multi-agent recommendation engine powered by Groq (with deterministic fallback).

---

## 1. Architecture Overview

- **Single Service Deployment**: Built using a multi-stage `Dockerfile` where Vite compiles the React/TypeScript frontend into static bundles, and FastAPI serves both the API endpoints (`/api/v1/*`) and the SPA frontend (`/*`) from a single container on Railway.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, PyMongo (synchronous driver), Argon2id password hashing, and PyJWT.
- **Database**: MongoDB Atlas with strict multi-tenant shop isolation (`shop_id` scoping across all collections and queries).
- **AI Recommendation Engine**: Multi-agent coordinator featuring Freshness, Markdown, Transfer, and Replenishment agents with Groq API integration and deterministic fallback.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router, TanStack Query, React Hook Form, Zod, and Recharts.

---

## 2. Visual Design System

- **Black Sidebar & Navigation (`#111216`)**: Consistent vertical sidebar on desktop and sliding responsive drawer on mobile.
- **Warm Orange Accent (`#f95721`)**: Primary buttons, active navigation pills, and critical alert highlights.
- **White Page Cards (`#ffffff`)**: Rounded surfaces with subtle borders (`rounded-3xl` / `rounded-2xl`).
- **Initial Empty State**: A new shop starts with zero records, an empty dashboard, and guided quick-actions.

---

## 3. Implemented Pages & Workflows

1. **Login (`/login`)**: Email/password, Argon2id verification, secure session tokens (cookie & Bearer), and UI Reference 1 illustration layout.
2. **Register & Shop Onboarding (`/register`)**: 3-step progress stepper (Shop Details &rarr; Owner Credentials &rarr; Address/Locality text fields without maps).
3. **Dashboard (`/dashboard`)**: Dynamic KPI cards (Total Products, Low Stock, Expiring Soon, Suggestions), quick action tiles, sales trend chart, and recent transaction log.
4. **All Products (`/inventory`)**: Category filtering, stock status badges (In Stock, Low Stock, Expiring Soon, Out of Stock), nearest expiry date, and batch counts.
5. **Add / Edit Product (`/inventory/new`, `/inventory/:id/edit`)**: Name, category, unit, selling price, and threshold validation.
6. **Add Inventory Batch (`/inventory/:id/batches/new`)**: Batch lot identifier, quantity received, purchase cost, purchase date, and expiry date.
7. **Record Sale (`/sales/new`)**: POS checkout interface, product search, touch-friendly plus/minus quantity selectors, discount inputs, and server-side FEFO deduction.
8. **Sales History (`/sales`)**: Audit log of past sales, line items, gross/net revenue totals, and references.
9. **Expiry Alerts (`/expiry`)**: Batches grouped into Expired, Critical (&le; 3 days), Expiring Soon (4-7 days), and Fresh stock with cost exposure.
10. **Smart Suggestions (`/recommendations`)**: AI recommendations with evidence, assumptions, confidence scores, and approve/dismiss controls.
11. **Nearby Shop Exchange (`/exchange`)**: Non-map directory of local participating retailers, surplus stock listings, and transfer requests.
12. **Transactions (`/transactions`)**: Multi-step exchange lifecycle (`requested` &rarr; `accepted` with inventory reservation &rarr; `confirm-handover` &rarr; `completed`).
13. **Replenishment (`/replenishment`)**: Low-stock deficit detection, estimated daily demand, purchase order draft generation, and receiving into batches.
14. **Reports & Analytics (`/reports`)**: Category distribution chart, revenue chart, and formula-injection-safe CSV export.
15. **Feedback & Impact (`/feedback`)**: Calibrate recommendation quality over time with star ratings and outcome tracking.
16. **Shop Settings (`/settings`)**: Shop profile, currency configuration, expiry warning days, and password changes.

---

## 4. Local Development Setup

### Prerequisites
- Node.js (v18+) & npm
- Python 3.12+
- MongoDB Atlas or local MongoDB instance (`mongodb://localhost:27017`)

### 1. Environment Configuration
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

### 2. Backend Setup
From the repository root:
```powershell
# Windows PowerShell
python -m venv backend/venv
backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Run tests:
```powershell
$env:PYTHONPATH="backend"; pytest backend/tests
```

Start the FastAPI backend:
```powershell
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
From `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Single-Service Multi-Stage Docker Build

To test the container build locally:
```bash
docker build -t nutana:latest .
docker run -p 8000:8000 -e PORT=8000 -e MONGODB_URI="your_mongodb_uri" nutana:latest
```

---

## 6. Railway Deployment Guide

1. Push this repository to **GitHub**.
2. Log into **[Railway.app](https://railway.app)**.
3. Click **New Project** &rarr; **Deploy from GitHub repo** &rarr; Select your `nutana` repository.
4. Railway will automatically detect the root `Dockerfile` specified in `railway.json`.
5. Under **Variables** in your Railway dashboard, add:
   - `ENVIRONMENT` = `production`
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
   - `MONGODB_DATABASE` = `nutana_prod`
   - `JWT_SECRET` = `<generate-a-strong-random-32-char-string>`
   - `COOKIE_SECURE` = `true`
   - `GROQ_API_KEY` = `<your-groq-api-key-optional>`
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
6. Railway automatically injects the `PORT` environment variable.
7. Under Railway Networking, generate a public domain (e.g., `nutana-production.up.railway.app`).
8. The single service will build the Vite frontend, copy the output into `/app/backend/static`, and start Uvicorn serving both API and frontend SPA routes.
