import os
from pathlib import Path
from typing import List

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

from train import train_model

PORT = int(os.getenv('PORT', '8000'))
MODEL_PATH = './model.joblib'


class PredictRequest(BaseModel):
  age: int = Field(..., ge=1, le=120)
  gender: str
  bmi: float = Field(..., ge=10, le=60)
  bp_systolic: int = Field(..., ge=70, le=250)
  bp_diastolic: int = Field(..., ge=40, le=150)
  glucose: float = Field(..., ge=40, le=400)
  heart_rate: int = Field(..., ge=30, le=220)
  smoking: bool
  alcohol: bool
  physical_activity: str
  symptoms_text: str


class PredictResponse(BaseModel):
  score: float
  level: str
  explanations: List[str]


app = FastAPI(title='Disease Risk ML Service', version='1.0.0')
model = None


def map_activity(value: str) -> int:
  activity = value.lower()
  mapping = {'low': 0, 'medium': 1, 'high': 2}
  if activity not in mapping:
    raise ValueError('physical_activity must be low, medium, or high')
  return mapping[activity]


def explain(payload: PredictRequest) -> List[str]:
  notes = []
  if payload.glucose >= 140:
    notes.append('Elevated glucose indicates increased metabolic risk.')
  if payload.bp_systolic >= 140 or payload.bp_diastolic >= 90:
    notes.append('Blood pressure levels suggest hypertension-related risk.')
  if payload.bmi >= 30:
    notes.append('Higher BMI raises risk for chronic cardio-metabolic disease.')
  if payload.smoking:
    notes.append('Smoking status increases long-term cardiovascular risk.')
  if payload.physical_activity.lower() == 'low':
    notes.append('Low physical activity is associated with elevated health risk.')
  if len(payload.symptoms_text.split()) >= 3:
    notes.append('Reported symptom pattern suggests follow-up screening is beneficial.')
  if not notes:
    notes.append('Most indicators appear stable with lower predicted risk.')
  return notes[:5]


@app.on_event('startup')
def startup_event():
  global model
  if not Path(MODEL_PATH).exists():
    train_model()
  model = joblib.load(MODEL_PATH)


@app.get('/health')
def health():
  return {'status': 'ok', 'port': PORT}


@app.post('/predict', response_model=PredictResponse)
def predict(payload: PredictRequest):
  gender = payload.gender.lower()
  gender_encoded = 1 if gender == 'male' else 0
  activity_encoded = map_activity(payload.physical_activity)

  features = np.array([
    payload.age,
    payload.bmi,
    payload.bp_systolic,
    payload.bp_diastolic,
    payload.glucose,
    payload.heart_rate,
    int(payload.smoking),
    int(payload.alcohol),
    activity_encoded,
    gender_encoded
  ]).reshape(1, -1)

  risk_probability = float(model.predict_proba(features)[0][1])
  score = round(max(0.0, min(100.0, risk_probability * 100)), 2)

  if score < 35:
    level = 'Low'
  elif score < 70:
    level = 'Medium'
  else:
    level = 'High'

  return PredictResponse(score=score, level=level, explanations=explain(payload))
