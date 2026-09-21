import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
  accuracy_score,
  average_precision_score,
  brier_score_loss,
  f1_score,
  precision_score,
  recall_score,
  roc_auc_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODEL_PATH = 'model.joblib'
MODEL_VERSION = 'synthetic-baseline-v3'
FEATURE_NAMES = [
  'age', 'bmi', 'bp_systolic', 'bp_diastolic', 'glucose',
  'heart_rate', 'smoking', 'alcohol', 'physical_activity',
  'gender_male', 'gender_female', 'gender_other'
]


def add_clinical_features(X):
  """
  Clinical feature engineering grounded in ACC/AHA and ADA risk models:
  - Pulse Pressure (arterial stiffness marker)
  - Mean Arterial Pressure (MAP - perfusion/vascular load)
  - Stage 2 Hypertension indicator (>=140 / >=90)
  - Obesity grade (BMI >= 30, BMI >= 35)
  - Glycemic risk bands (Pre-diabetic >= 100, Diabetic >= 126)
  - Cardio-metabolic interaction synergy
  - Metabolic syndrome cluster count
  """
  X = np.asarray(X, dtype=float)
  age = X[:, 0]
  bmi = X[:, 1]
  sys_bp = X[:, 2]
  dia_bp = X[:, 3]
  glucose = X[:, 4]
  hr = X[:, 5]
  smoking = X[:, 6]
  alcohol = X[:, 7]
  activity = X[:, 8]

  pulse_pressure = np.maximum(0.0, sys_bp - dia_bp)
  map_val = dia_bp + pulse_pressure / 3.0

  stage2_htn = ((sys_bp >= 140.0) | (dia_bp >= 90.0)).astype(float)
  obesity_tier = (bmi >= 30.0).astype(float) + (bmi >= 35.0).astype(float)
  hyperglycemia = (glucose >= 100.0).astype(float) + (glucose >= 126.0).astype(float)
  cvd_synergy = (smoking * stage2_htn * (age >= 45.0).astype(float))
  metabolic_cluster = (
    (bmi >= 28.0).astype(float)
    + stage2_htn
    + (glucose >= 100.0).astype(float)
    + (activity == 0.0).astype(float)
  )

  engineered = np.column_stack([
    pulse_pressure,
    map_val,
    stage2_htn,
    obesity_tier,
    hyperglycemia,
    cvd_synergy,
    metabolic_cluster
  ])
  return np.hstack([X, engineered])


def generate_clinically_grounded_data(samples=4000, random_state=42):
  """
  Generates a synthetic population with clinically realistic correlated distributions
  reflecting AHA/ACC Cardiovascular and ADA Type-2 Diabetes non-invasive risk profiles.
  """
  rng = np.random.default_rng(random_state)

  age = rng.integers(18, 86, size=samples)
  # Correlated BMI with age and slight noise
  bmi = np.clip(rng.normal(27.5, 5.2, size=samples) + 0.02 * (age - 45), 16.0, 50.0)

  # Blood pressure scales with age and BMI
  sys_base = 112.0 + 0.35 * (age - 20) + 0.45 * (bmi - 24)
  bp_systolic = np.clip(rng.normal(sys_base, 14.0), 90.0, 220.0)
  bp_diastolic = np.clip(rng.normal(70.0 + 0.15 * (age - 20) + 0.25 * (bmi - 24), 9.0), 50.0, bp_systolic - 15.0)

  # Glucose scales with BMI and age
  glucose_base = 92.0 + 0.7 * np.maximum(0.0, bmi - 25.0) + 0.15 * (age - 30)
  glucose = np.clip(rng.normal(glucose_base, 22.0), 65.0, 350.0)

  heart_rate = np.clip(rng.normal(74.0 + 0.15 * (bmi - 24.0), 11.0), 45.0, 160.0)
  smoking = rng.binomial(1, 0.22, size=samples)
  alcohol = rng.binomial(1, 0.28, size=samples)
  physical_activity = rng.choice([0, 1, 2], size=samples, p=[0.35, 0.45, 0.20])
  gender = rng.choice([0, 1, 2], size=samples, p=[0.05, 0.48, 0.47])

  pulse_pressure = bp_systolic - bp_diastolic

  # 1. Cardiovascular Risk Score component (AHA/Framingham inspired)
  cv_risk = (
    0.025 * np.maximum(0.0, age - 35)
    + 0.035 * np.maximum(0.0, bp_systolic - 120.0)
    + 0.025 * np.maximum(0.0, pulse_pressure - 50.0)
    + 0.85 * smoking
    + 0.015 * np.maximum(0.0, heart_rate - 78.0)
    + 0.20 * (gender == 1)  # male baseline cardiovascular elevation
  )

  # 2. Type 2 Diabetes / Metabolic Risk component (ADA risk score inspired)
  diabetes_risk = (
    0.020 * np.maximum(0.0, age - 40)
    + 0.080 * np.maximum(0.0, bmi - 25.0)
    + 0.045 * np.maximum(0.0, glucose - 100.0)
    + 0.50 * (physical_activity == 0)
    - 0.35 * (physical_activity == 2)
    + 0.30 * ((bmi >= 30.0) & (glucose >= 110.0))
  )

  # 3. Synergy and interaction terms
  synergy = 0.45 * (smoking & (bp_systolic >= 140.0)) + 0.30 * (alcohol & (bp_systolic >= 140.0))

  total_signal = cv_risk + diabetes_risk + synergy + rng.normal(0, 0.8, size=samples)
  threshold = np.percentile(total_signal, 60)
  y = (total_signal > threshold).astype(int)

  X = np.column_stack([
    age,
    bmi,
    bp_systolic,
    bp_diastolic,
    glucose,
    heart_rate,
    smoking,
    alcohol,
    physical_activity,
    gender == 1,
    gender == 2,
    gender == 0
  ])

  return X, y


def train_model():
  print('Generating clinically grounded population data...')
  X, y = generate_clinically_grounded_data()

  X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
  )

  X_train_eng = add_clinical_features(X_train)
  X_test_eng = add_clinical_features(X_test)

  base_gb = GradientBoostingClassifier(
    n_estimators=120,
    learning_rate=0.08,
    max_depth=3,
    subsample=0.85,
    random_state=42
  )

  pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', CalibratedClassifierCV(estimator=base_gb, method='sigmoid', cv=3))
  ])

  print('Fitting calibrated ensemble model pipeline...')
  pipeline.fit(X_train_eng, y_train)

  probabilities = pipeline.predict_proba(X_test_eng)[:, 1]
  predictions = (probabilities >= 0.5).astype(int)

  metrics = {
    'accuracy': round(float(accuracy_score(y_test, predictions)), 4),
    'roc_auc': round(float(roc_auc_score(y_test, probabilities)), 4),
    'pr_auc': round(float(average_precision_score(y_test, probabilities)), 4),
    'precision': round(float(precision_score(y_test, predictions, zero_division=0)), 4),
    'recall': round(float(recall_score(y_test, predictions, zero_division=0)), 4),
    'f1': round(float(f1_score(y_test, predictions, zero_division=0)), 4),
    'brier_score': round(float(brier_score_loss(y_test, probabilities)), 4)
  }

  artifact = {
    'model': pipeline,
    'model_version': MODEL_VERSION,
    'feature_names': FEATURE_NAMES,
    'thresholds': {'medium': 35.0, 'high': 70.0},
    'evaluation': metrics,
    'data_source': 'clinically-grounded-synthetic-v3',
    'clinical_validation': False,
    'algorithm': 'CalibratedGradientBoostingClassifier'
  }

  joblib.dump(artifact, MODEL_PATH)
  print(f'Model trained and saved to {MODEL_PATH}.')
  print(f'Evaluation metrics: {metrics}')
  return artifact


if __name__ == '__main__':
  train_model()
