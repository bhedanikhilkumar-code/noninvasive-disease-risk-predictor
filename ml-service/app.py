import os
from pathlib import Path
from typing import List

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from train import FEATURE_COUNT, train_model

PORT = int(os.getenv('PORT', '8000'))
MODEL_PATH = './model.joblib'

KNOWN_SYMPTOMS = {
  'fatigue', 'headache', 'dizziness', 'thirst', 'nausea', 'vomiting',
  'palpitations', 'chest pain', 'shortness of breath', 'breathlessness',
  'blurred vision', 'swelling', 'weakness', 'fever', 'cough', 'sleep'
}


class PredictRequest(BaseModel):
  model_config = ConfigDict(extra='forbid')

  age: int = Field(..., ge=1, le=120)
  gender: str = Field(..., min_length=1, max_length=20)
  bmi: float = Field(..., ge=10, le=60)
  bp_systolic: int = Field(..., ge=70, le=250)
  bp_diastolic: int = Field(..., ge=40, le=150)
  glucose: float = Field(..., ge=40, le=400)
  heart_rate: int = Field(..., ge=30, le=220)
  smoking: bool
  alcohol: bool
  physical_activity: str = Field(..., min_length=1, max_length=20)
  symptoms_text: str = Field(..., min_length=3, max_length=1000)


class PredictResponse(BaseModel):
  score: float
  level: str
  explanations: List[str]


app = FastAPI(
  title='Disease Risk ML Service',
  version='1.1.0',
  description='Demo risk scoring service. Not a diagnostic medical device.'
)
model = None


def map_activity(value: str) -> int:
  mapping = {'low': 0, 'medium': 1, 'high': 2}
  activity = value.strip().lower()
  if activity not in mapping:
    raise ValueError('physical_activity must be low, medium, or high')
  return mapping[activity]


def symptom_burden(value: str) -> int:
  text = value.lower()
  matches = sum(1 for symptom in KNOWN_SYMPTOMS if symptom in text)
  return min(matches, 5)


def explain(payload: PredictRequest) -> List[str]:
  notes = []
  if payload.glucose >= 140:
    notes.append('Glucose is above the demo model\'s elevated-risk threshold.')
  if payload.bp_systolic >= 140 or payload.bp_diastolic >= 90:
    notes.append('Blood pressure is in an elevated range for this demo.')
  if payload.bmi >= 30:
    notes.append('BMI is in the higher range used by the demo scoring logic.')
  if payload.smoking:
    notes.append('Smoking is included as a higher-risk lifestyle signal.')
  if payload.physical_activity.strip().lower() == 'low':
    notes.append('Low physical activity is included as a higher-risk signal.')
  if symptom_burden(payload.symptoms_text) > 0:
    notes.append('Recognized symptom keywords contribute to the demo risk score.')
  if not notes:
    notes.append('No major elevated indicators were detected by the demo rules.')
  return notes[:5]


def load_model():
  global model
  path = Path(MODEL_PATH)
  if not path.exists():
    train_model()
  loaded = joblib.load(path)
  if getattr(loaded, 'n_features_in_', FEATURE_COUNT) != FEATURE_COUNT:
    train_model()
    loaded = joblib.load(path)
  model = loaded


@app.on_event('startup')
def startup_event():
  load_model()


@app.get('/health')
def health():
  return {'status': 'ok', 'model_loaded': model is not None, 'feature_count': FEATURE_COUNT}


@app.post('/predict', response_model=PredictResponse)
def predict(payload: PredictRequest):
  if payload.gender.strip().lower() not in {'male', 'female', 'other'}:
    raise HTTPException(status_code=422, detail='gender must be male, female, or other')

  try:
    gender_encoded = 1 if payload.gender.strip().lower() == 'male' else 0
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
      gender_encoded,
      symptom_burden(payload.symptoms_text),
    ], dtype=float).reshape(1, -1)

    risk_probability = float(model.predict_proba(features)[0][1])
    score = round(float(np.clip(risk_probability * 100, 0, 100)), 2)
  except ValueError as error:
    raise HTTPException(status_code=422, detail=str(error)) from error
  except Exception as error:
    raise HTTPException(status_code=503, detail='ML model is temporarily unavailable') from error

  if score < 35:
    level = 'Low'
  elif score < 70:
    level = 'Medium'
  else:
    level = 'High'

  return PredictResponse(score=score, level=level, explanations=explain(payload))
