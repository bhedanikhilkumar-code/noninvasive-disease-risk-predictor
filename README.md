# Noninvasive Disease Risk Predictor

A final-year B.Tech project demonstrating a web-based, non-invasive health-risk screening workflow. Users enter basic vitals, lifestyle signals, and symptom notes; the application sends the data through a Node.js API to a Python ML service and returns a 0–100 demo risk score with Low / Medium / High classification and explanations.

> **Important:** This repository currently uses **synthetic/generated training data**. It is an educational software/ML prototype, not a clinically validated model, diagnostic device, or medical-advice system.

## Architecture

```text
React + Vite frontend
        │
        ▼
Node.js + Express API
        │
        ├── MongoDB (session-scoped history)
        │
        ▼
FastAPI ML service
        │
        ▼
StandardScaler + LogisticRegression
        │
        ▼
Risk probability → 0–100 score → Low/Medium/High
```

## Current ML Logic

The demo model uses 11 features:

- Age
- BMI
- Systolic blood pressure
- Diastolic blood pressure
- Glucose
- Heart rate
- Smoking
- Alcohol use
- Physical activity
- Gender (demo encoding)
- Recognized symptom-keyword burden

`ml-service/train.py` generates 2,000 synthetic records and creates labels from a transparent weighted risk signal. The model is then trained with an 80/20 stratified split using `StandardScaler` and `LogisticRegression`.

The score is the positive-class probability multiplied by 100. Classification thresholds are:

- `< 35` → Low
- `35–69.99` → Medium
- `>= 70` → High

The explanations are a separate, human-readable rule layer; they are not model-generated medical explanations.

## Application Flow

1. User opens the React application.
2. A random anonymous browser session ID is stored locally.
3. User submits validated health inputs.
4. Express validates and normalizes the request.
5. Express calls the FastAPI ML service.
6. The ML service validates inputs, derives symptom burden, and runs the model.
7. Express stores the input/output under that anonymous session.
8. The frontend displays the score and explanation.
9. History and dashboard endpoints only return records for the current session ID.

## Repository Structure

```text
noninvasive-disease-risk-predictor/
├── frontend/        # React + Vite UI
├── backend/         # Express API + MongoDB persistence
├── ml-service/      # FastAPI + scikit-learn model
├── docs/            # Architecture, case study, roadmap and quality docs
└── docker-compose.yml
```

## Local Development

### Option A — Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- ML service: `http://localhost:8000`
- MongoDB: `localhost:27017`

### Option B — Run services separately

Backend requires `MONGODB_URI` and optionally `ML_SERVICE_URL` / `FRONTEND_URL`.

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

ML service:

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## Engineering Hardening Included

- Strict request validation at both API and ML boundaries.
- Request body size limit on Express.
- Helmet security headers and restricted CORS methods.
- Generic production API errors instead of leaking server exception messages.
- ML service timeout handling.
- Anonymous session scoping for history and dashboard data.
- No-store caching headers for health/history/stat responses.
- Refresh-safe result page using session storage.
- Responsive and keyboard-accessible frontend styling.
- User-facing disclosure of synthetic-data and non-diagnostic limitations.

## Known Limitations

This project should **not** be described as a medically accurate disease predictor in its current form.

1. Training data is synthetic rather than a clinically sourced dataset.
2. There is no external clinical validation or calibration study.
3. The model is a single binary logistic-regression classifier rather than disease-specific models.
4. Gender encoding is simplified for the demo and should not be treated as a clinical representation.
5. Symptom processing is keyword-based, not clinical NLP.
6. Anonymous session IDs are privacy scoping, not authentication or authorization.
7. Production deployment would require stronger identity, privacy, audit, monitoring, and security controls.

## Recommended Next ML Milestones

1. Select a specific disease/risk target and define the intended population.
2. Use a licensed, ethically sourced, clinically appropriate dataset.
3. Establish train/validation/test splits without leakage.
4. Compare suitable baseline and advanced models.
5. Report precision, recall, F1, ROC-AUC, PR-AUC, calibration, and confusion matrix—not accuracy alone.
6. Add subgroup/fairness evaluation and missing-data handling.
7. Add explainability tied to model features, with clinical review.
8. Validate prospectively before making any clinical claims.

## Documentation Hub

- `docs/ARCHITECTURE.md` — system structure and workflow
- `docs/CASE_STUDY.md` — product framing and engineering decisions
- `docs/CODE_AUDIT.md` — this audit and hardening pass
- `docs/ROADMAP.md` — future work
- `docs/QUALITY.md` — repository quality standard
- `docs/REVIEW_CHECKLIST.md` — presentation/recruiter checklist
- `SECURITY.md` — responsible security reporting
- `CONTRIBUTING.md` — contribution workflow
- `SUPPORT.md` — support guidance
- `CODE_OF_CONDUCT.md` — collaboration standard

## License

See `LICENSE`.
