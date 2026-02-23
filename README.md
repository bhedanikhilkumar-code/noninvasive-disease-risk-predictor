# AI-Based Early Disease Risk Prediction (Non-Invasive)

A complete final-year project scaffold for predicting early disease risk using non-invasive inputs (symptoms, lifestyle, and basic vitals).

## Architecture

- **frontend/**: React + Vite UI
- **backend/**: Node.js + Express API gateway
- **ml-service/**: Python FastAPI + scikit-learn inference
- **mongo**: MongoDB database (Docker service)
- **docker-compose.yml**: Run the full system together

## Features

- Home page with project intro and quick start action
- Prediction form with required non-invasive fields
- Risk result page with score, level, and explanation bullets
- History view of latest predictions (limit/skip support)
- Dashboard with aggregated analytics + bar chart
- MongoDB persistence with indexed prediction records

## Data Model (MongoDB / Mongoose)

`Prediction`
- `createdAt`: Date (default now, indexed)
- `input`: object
  - `age`, `gender`, `bmi`, `bp_systolic`, `bp_diastolic`, `glucose`, `heart_rate`, `smoking`, `alcohol`, `physical_activity`, `symptoms_text`
- `output`: object
  - `score` (0-100), `level` (Low|Medium|High), `explanations` (string[])

Additional index: `output.level`.

## Quick Start (Docker)

```bash
docker compose up --build
```

Service URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- ML Service: http://localhost:8000
- MongoDB: mongodb://localhost:27017

## Manual Setup

### 1) Start MongoDB

Run local MongoDB on `mongodb://localhost:27017`.

### 2) ML Service

```bash
cd ml-service
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train.py
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 4) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### backend/.env.example
- `PORT=5000`
- `MONGODB_URI=mongodb://mongo:27017/disease_risk_db`
- `ML_SERVICE_URL=http://ml-service:8000`
- `FRONTEND_URL=http://localhost:5173`

### ml-service/.env.example
- `PORT=8000`

### frontend/.env.example
- `VITE_API_BASE_URL=http://localhost:5000`

## API Endpoints

### POST `/api/predict`
Validates input, calls ML service, stores prediction in MongoDB, returns saved record.

Sample payload:

```json
{
  "age": 45,
  "gender": "male",
  "bmi": 29.1,
  "bp_systolic": 142,
  "bp_diastolic": 92,
  "glucose": 156,
  "heart_rate": 88,
  "smoking": true,
  "alcohol": false,
  "physical_activity": "low",
  "symptoms_text": "fatigue and frequent urination"
}
```

Curl example:

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age":45,
    "gender":"male",
    "bmi":29.1,
    "bp_systolic":142,
    "bp_diastolic":92,
    "glucose":156,
    "heart_rate":88,
    "smoking":true,
    "alcohol":false,
    "physical_activity":"low",
    "symptoms_text":"fatigue and frequent urination"
  }'
```

### GET `/api/history?limit=50&skip=0`
Returns recent predictions sorted by `createdAt` descending.

### GET `/api/stats`
Returns:
- total prediction count
- average score
- count by risk level
- count of predictions in last 7 days

## Notes

- ML service auto-trains baseline model if `model.joblib` is missing.
- CORS is enabled for frontend development URL.
- Secrets are not committed; use `.env.example` templates.

## License

MIT
