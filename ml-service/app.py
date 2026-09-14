import os
from pathlib import Path
from typing import List, Literal

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator

from train import train_model

PORT = int(os.getenv('PORT', '8000'))
MODEL_PATH = './model.joblib'


class PredictRequest(BaseModel):
  model_config = {'extra': 'forbid'}

  age: int = Field(..., ge=1, le=120)
  gender: Literal['male', 'female', 'other']
  bmi: float = Field(..., ge=10, le=60)
  bp_systolic: int = Field(..., ge=70, le=250)
  bp_diastolic: int = Field(..., ge=40, le=150)
  glucose: float = Field(..., ge=40, le=400)
  heart_rate: int = Field(..., ge=30, le=220)
  smoking: bool
  alcohol: bool
  physical_activity: Literal['low', 'medium', 'high']
  symptoms_text: str = Field(..., min_length=3, max_length=2000)

  @model_validator(mode='after')
  def validate_blood_pressure(self):
    if self.bp_diastolic >= self.bp_systolic:
      raise ValueError('bp_diastolic must be lower than bp_systolic')
    return self


class PredictResponse(BaseModel):
  score: float
  level: str
  explanations: List[str]
  warnings: List[str]
  model_version: str
  disclaimer: str


app = FastAPI(title='Disease Risk ML Service', version='1.0.0')
model = None
model_version = 'unknown'
feature_names = []
thresholds = {'medium': 35.0, 'high': 70.0}
clinical_validation = False
evaluation = {}
EXPECTED_FEATURE_NAMES = [
  'age', 'bmi', 'bp_systolic', 'bp_diastolic', 'glucose',
  'heart_rate', 'smoking', 'alcohol', 'physical_activity',
  'gender_male', 'gender_female', 'gender_other'
]


def map_activity(value: str) -> int:
  activity = value.lower()
  mapping = {'low': 0, 'medium': 1, 'high': 2}
  if activity not in mapping:
    raise ValueError('physical_activity must be low, medium, or high')
  return mapping[activity]


def explain(payload: PredictRequest) -> List[str]:
  notes = []
  if payload.glucose >= 140:
    notes.append('Elevated glucose may contribute to increased metabolic risk.')
  if payload.bp_systolic >= 140 or payload.bp_diastolic >= 90:
    notes.append('Blood pressure levels may contribute to hypertension-related risk.')
  if payload.bmi >= 30:
    notes.append('Higher BMI may contribute to chronic cardio-metabolic risk.')
  if payload.smoking:
    notes.append('Smoking may contribute to long-term cardiovascular risk.')
  if payload.physical_activity.lower() == 'low':
    notes.append('Low physical activity may contribute to elevated health risk.')
  if len(payload.symptoms_text.split()) >= 3:
    notes.append('Reported symptom pattern suggests follow-up screening is beneficial.')
  if not notes:
    notes.append('Most indicators appear stable with lower predicted risk.')
  return notes[:5]


def warnings(payload: PredictRequest) -> List[str]:
  alerts = []
  if payload.bp_systolic >= 180 or payload.bp_diastolic >= 120:
    alerts.append('Very high blood pressure detected. Seek urgent medical assessment.')
  if payload.glucose >= 300:
    alerts.append('Very high glucose detected. Contact a healthcare professional promptly.')
  if payload.heart_rate < 40 or payload.heart_rate > 150:
    alerts.append('Unusual heart rate detected. Seek medical advice, especially if symptomatic.')
  return alerts


@app.on_event('startup')
def startup_event():
  global model, model_version, feature_names, thresholds, clinical_validation, evaluation
  if not Path(MODEL_PATH).exists():
    train_model()
  bundle = joblib.load(MODEL_PATH)
  if (
    not isinstance(bundle, dict)
    or 'model' not in bundle
    or bundle.get('feature_names') != EXPECTED_FEATURE_NAMES
  ):
    print('Incompatible model artifact detected; retraining the baseline model.')
    train_model()
    bundle = joblib.load(MODEL_PATH)
  if not isinstance(bundle, dict) or 'model' not in bundle:
    raise RuntimeError('Model artifact is invalid or missing metadata')
  model = bundle['model']
  model_version = bundle.get('model_version', 'unknown')
  feature_names = bundle.get('feature_names', [])
  thresholds = bundle.get('thresholds', thresholds)
  clinical_validation = bool(bundle.get('clinical_validation', False))
  evaluation = bundle.get('evaluation', {})
  if feature_names != EXPECTED_FEATURE_NAMES:
    raise RuntimeError('Model feature schema does not match the prediction schema')
  if not {'medium', 'high'} <= thresholds.keys() or thresholds['medium'] >= thresholds['high']:
    raise RuntimeError('Model thresholds are invalid')


@app.get('/health')
def health():
  return {'status': 'ok', 'port': PORT}


@app.get('/ready')
def ready():
  if model is None:
    return {'status': 'not_ready'}
  return {
    'status': 'ready',
    'model_version': model_version,
    'clinical_validation': clinical_validation
  }


@app.get('/model-info')
def model_info():
  if model is None:
    return {'status': 'not_ready'}
  return {
    'model_version': model_version,
    'feature_names': feature_names,
    'thresholds': thresholds,
    'evaluation': evaluation,
    'data_source': 'synthetic-demo-data',
    'clinical_validation': clinical_validation
  }


@app.post('/predict', response_model=PredictResponse)
def predict(payload: PredictRequest):
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
    int(payload.gender == 'male'),
    int(payload.gender == 'female'),
    int(payload.gender == 'other')
  ]).reshape(1, -1)

  risk_probability = float(model.predict_proba(features)[0][1])
  score = round(max(0.0, min(100.0, risk_probability * 100)), 2)

  if score < thresholds['medium']:
    level = 'Low'
  elif score < thresholds['high']:
    level = 'Medium'
  else:
    level = 'High'

  return PredictResponse(
    score=score,
    level=level,
    explanations=explain(payload),
    warnings=warnings(payload),
    model_version=model_version,
    disclaimer='This is a screening estimate, not a diagnosis or a substitute for medical care.'
  )
