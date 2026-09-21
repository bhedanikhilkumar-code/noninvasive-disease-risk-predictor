import os
import re
from pathlib import Path
from typing import List, Literal, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, model_validator

from train import MODEL_PATH, add_clinical_features, train_model

PORT = int(os.getenv('PORT', '8000'))


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
  cardiovascular_score: Optional[float] = None
  diabetes_score: Optional[float] = None
  symptom_flags: Optional[List[str]] = None
  recommendations: Optional[List[str]] = None


app = FastAPI(title='Disease Risk ML Service', version='2.0.0')
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

# Clinical symptom dictionary for NLP triage
SYMPTOM_DICTIONARY = {
  'cardiac': [
    (r'\bchest\s*(pain|tight|pressure|heaviness|discomfort)\b', 'Chest discomfort / tightness'),
    (r'\b(shortness of breath|breathless|dyspnea|hard to breathe)\b', 'Shortness of breath / dyspnea'),
    (r'\b(palpitation|racing heart|fluttering|irregular heart)\b', 'Heart palpitations / irregular pulse'),
    (r'\b(radiating pain|arm pain|left arm|jaw pain)\b', 'Radiating cardiac pain'),
    (r'\b(cold sweat|sweating profusely|diaphoresis)\b', 'Cold sweats / diaphoresis'),
    (r'\b(dizzy|dizziness|lightheaded|faint|syncope)\b', 'Dizziness / presyncope')
  ],
  'metabolic': [
    (r'\b(excessive thirst|constant thirst|polydipsia)\b', 'Excessive thirst (Polydipsia)'),
    (r'\b(frequent urinat|peeing a lot|polyuria|night urinat)\b', 'Frequent urination (Polyuria)'),
    (r'\b(blurred vision|blurry vision|vision change)\b', 'Blurred vision'),
    (r'\b(slow healing|cuts not healing|wound)\b', 'Slow-healing sores / cuts'),
    (r'\b(unexplained weight loss|rapid weight loss)\b', 'Unexplained weight loss'),
    (r'\b(tingling|numbness|pins and needles)\b', 'Peripheral tingling / numbness')
  ],
  'constitutional': [
    (r'\b(chronic fatigue|extreme fatigue|exhaustion|always tired)\b', 'Chronic fatigue / exhaustion'),
    (r'\b(severe headache|throbbing headache)\b', 'Severe headache'),
    (r'\b(swollen ankles|swollen legs|leg swelling|edema)\b', 'Lower extremity swelling / edema')
  ]
}


@app.middleware('http')
async def request_id_middleware(request: Request, call_next):
  request_id = request.headers.get('x-request-id') or os.urandom(16).hex()
  response = await call_next(request)
  response.headers['x-request-id'] = request_id
  return response


def map_activity(value: str) -> int:
  activity = value.lower()
  mapping = {'low': 0, 'medium': 1, 'high': 2}
  if activity not in mapping:
    raise ValueError('physical_activity must be low, medium, or high')
  return mapping[activity]


def extract_symptoms(text: str):
  normalized = text.lower()
  detected = []
  categories = {'cardiac': False, 'metabolic': False, 'constitutional': False}
  has_acute_cardiac = False

  for category, patterns in SYMPTOM_DICTIONARY.items():
    for pattern, label in patterns:
      if re.search(pattern, normalized):
        detected.append(label)
        categories[category] = True
        if category == 'cardiac' and any(k in pattern for k in ['chest', 'radiating', 'shortness']):
          has_acute_cardiac = True

  return {
    'flags': detected,
    'categories': categories,
    'has_acute_cardiac': has_acute_cardiac
  }


def calculate_sub_scores(payload: PredictRequest, symptom_data: dict):
  """
  Calculates clinically meaningful sub-scores:
  - Cardiovascular Risk (AHA / Framingham non-invasive factors)
  - Type-2 Diabetes / Metabolic Risk (ADA non-invasive factors)
  """
  # 1. Cardiovascular Risk Calculation (0 - 100)
  cvd_points = 0.0
  # Age contribution
  if payload.age >= 65:
    cvd_points += 22.0
  elif payload.age >= 50:
    cvd_points += 15.0
  elif payload.age >= 40:
    cvd_points += 8.0

  # Blood pressure staging (ACC/AHA 2017)
  sys = payload.bp_systolic
  dia = payload.bp_diastolic
  if sys >= 180 or dia >= 120:
    cvd_points += 38.0
  elif sys >= 140 or dia >= 90:
    cvd_points += 26.0
  elif sys >= 130 or dia >= 80:
    cvd_points += 16.0
  elif sys >= 120:
    cvd_points += 8.0

  # Pulse pressure (arterial stiffness)
  pp = sys - dia
  if pp >= 60:
    cvd_points += 10.0

  # Smoking multiplier
  if payload.smoking:
    cvd_points += 18.0

  # Resting heart rate
  if payload.heart_rate >= 90:
    cvd_points += 8.0

  # Cardiac symptoms
  if symptom_data['has_acute_cardiac']:
    cvd_points += 16.0
  elif symptom_data['categories']['cardiac']:
    cvd_points += 8.0

  cardiovascular_score = round(min(100.0, cvd_points), 2)

  # 2. Type-2 Diabetes / Metabolic Risk Calculation (0 - 100)
  t2d_points = 0.0
  # Age
  if payload.age >= 60:
    t2d_points += 18.0
  elif payload.age >= 45:
    t2d_points += 12.0
  elif payload.age >= 35:
    t2d_points += 6.0

  # BMI categories (WHO)
  if payload.bmi >= 35.0:
    t2d_points += 32.0
  elif payload.bmi >= 30.0:
    t2d_points += 24.0
  elif payload.bmi >= 25.0:
    t2d_points += 14.0

  # Glucose bands
  if payload.glucose >= 200:
    t2d_points += 36.0
  elif payload.glucose >= 126:
    t2d_points += 28.0
  elif payload.glucose >= 100:
    t2d_points += 16.0

  # Physical inactivity
  if payload.physical_activity == 'low':
    t2d_points += 12.0
  elif payload.physical_activity == 'high':
    t2d_points -= 5.0

  # Metabolic symptoms
  if symptom_data['categories']['metabolic']:
    t2d_points += 14.0

  diabetes_score = round(max(0.0, min(100.0, t2d_points)), 2)

  return cardiovascular_score, diabetes_score


def generate_explanations(payload: PredictRequest, symptom_data: dict) -> List[str]:
  notes = []

  # Blood pressure explanation
  sys = payload.bp_systolic
  dia = payload.bp_diastolic
  if sys >= 180 or dia >= 120:
    notes.append(f'Blood Pressure ({sys}/{dia} mmHg) is in the Hypertensive Crisis stage, representing severe acute vascular risk.')
  elif sys >= 140 or dia >= 90:
    notes.append(f'Blood Pressure ({sys}/{dia} mmHg) meets Stage 2 Hypertension criteria (AHA/ACC), increasing vascular and cardiac load.')
  elif sys >= 130 or dia >= 80:
    notes.append(f'Blood Pressure ({sys}/{dia} mmHg) is in Stage 1 Hypertension, indicating early arterial resistance.')
  elif sys >= 120:
    notes.append(f'Blood Pressure ({sys}/{dia} mmHg) is elevated above optimal levels (<120/80 mmHg).')

  # Glucose explanation
  if payload.glucose >= 200:
    notes.append(f'Glucose ({payload.glucose:.0f} mg/dL) is markedly elevated, strongly suggesting hyperglycemic metabolic stress.')
  elif payload.glucose >= 126:
    notes.append(f'Glucose ({payload.glucose:.0f} mg/dL) exceeds the standard fasting clinical threshold for diabetes evaluation.')
  elif payload.glucose >= 100:
    notes.append(f'Glucose ({payload.glucose:.0f} mg/dL) indicates impaired fasting/pre-diabetic glycemic range (100-125 mg/dL).')

  # BMI explanation
  if payload.bmi >= 35:
    notes.append(f'BMI of {payload.bmi:.1f} falls in Class II+ Obesity, significantly multiplying insulin resistance and cardio-metabolic strain.')
  elif payload.bmi >= 30:
    notes.append(f'BMI of {payload.bmi:.1f} indicates Class I Obesity, a key predisposing factor for cardiometabolic dysfunction.')
  elif payload.bmi >= 25:
    notes.append(f'BMI of {payload.bmi:.1f} is in the overweight range (25.0-29.9), contributing moderately to metabolic risk.')

  # Smoking & Lifestyle
  if payload.smoking:
    notes.append('Active tobacco smoking acts as a potent multiplier for endothelial injury and atherosclerotic plaque buildup.')
  if payload.physical_activity == 'low':
    notes.append('Low physical activity level impairs glucose uptake and reduces cardiorespiratory fitness.')

  # Symptom-driven insights
  if symptom_data['flags']:
    symptom_list = ', '.join(symptom_data['flags'][:3])
    notes.append(f'Reported symptoms ({symptom_list}) align with clinical screening markers that warrant professional follow-up.')

  if not notes:
    notes.append('All evaluated vitals and lifestyle parameters remain within standard low-risk ranges.')

  return notes[:5]


def generate_recommendations(payload: PredictRequest, symptom_data: dict) -> List[str]:
  recs = []
  if payload.bp_systolic >= 130 or payload.bp_diastolic >= 80:
    recs.append('Monitor blood pressure regularly and adopt DASH dietary principles (reduced sodium <2,300 mg/day, increased dietary potassium).')
  if payload.glucose >= 100 or payload.bmi >= 25:
    recs.append('Prioritize whole grains, lean proteins, and low-glycemic foods; schedule a formal HbA1c screening.')
  if payload.physical_activity != 'high':
    recs.append('Target at least 150 minutes per week of moderate-intensity aerobic physical activity (e.g. brisk walking).')
  if payload.smoking:
    recs.append('Seek a smoking cessation program; vascular benefits begin within weeks of quitting.')
  if symptom_data['flags']:
    recs.append('Discuss reported symptoms with a primary healthcare physician for targeted diagnostic testing.')
  if not recs:
    recs.append('Maintain current balanced nutrition, regular physical activity, and annual preventive health check-ups.')
  return recs[:4]


def generate_warnings(payload: PredictRequest, symptom_data: dict) -> List[str]:
  alerts = []
  # Critical vital thresholds
  if payload.bp_systolic >= 180 or payload.bp_diastolic >= 120:
    alerts.append('HYPERTENSIVE CRISIS ALERT: Extremely elevated blood pressure detected. Seek immediate emergency medical assessment.')
  if payload.glucose >= 300:
    alerts.append('SEVERE HYPERGLYCEMIA ALERT: Critically high blood glucose detected. Contact a healthcare provider urgently.')
  if payload.heart_rate < 40 or payload.heart_rate > 150:
    alerts.append('CARDIAC RHYTHM ALERT: Atypical resting heart rate detected. Prompt clinical evaluation is advised.')

  # Acute symptom triage
  if symptom_data['has_acute_cardiac']:
    alerts.append('HIGH-PRIORITY SYMPTOM NOTICE: Reported chest or radiating pain / breathlessness requires immediate clinical evaluation to rule out acute coronary syndrome.')

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
    'data_source': 'clinically-grounded-synthetic-v3',
    'clinical_validation': clinical_validation
  }


@app.post('/predict', response_model=PredictResponse)
def predict(payload: PredictRequest):
  if model is None:
    raise HTTPException(status_code=503, detail='Prediction model is not ready')

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
  ], dtype=float).reshape(1, -1)

  engineered_features = add_clinical_features(features)
  raw_prob = float(model.predict_proba(engineered_features)[0][1])

  # Extract symptom clinical tags & calculate condition sub-scores
  symptom_data = extract_symptoms(payload.symptoms_text)
  cv_score, diabetes_score = calculate_sub_scores(payload, symptom_data)

  # Adjust composite score by clinical symptom burden
  symptom_multiplier = 1.0
  if symptom_data['has_acute_cardiac']:
    symptom_multiplier += 0.20
  elif symptom_data['flags']:
    symptom_multiplier += min(0.15, len(symptom_data['flags']) * 0.05)

  score = round(max(0.0, min(100.0, raw_prob * 100 * symptom_multiplier)), 2)

  if score < thresholds['medium']:
    level = 'Low'
  elif score < thresholds['high']:
    level = 'Medium'
  else:
    level = 'High'

  explanations = generate_explanations(payload, symptom_data)
  warns = generate_warnings(payload, symptom_data)
  recs = generate_recommendations(payload, symptom_data)

  return PredictResponse(
    score=score,
    level=level,
    explanations=explanations,
    warnings=warns,
    model_version=model_version,
    disclaimer='This is a screening estimate, not a diagnosis or a substitute for medical care.',
    cardiovascular_score=cv_score,
    diabetes_score=diabetes_score,
    symptom_flags=symptom_data['flags'],
    recommendations=recs
  )
