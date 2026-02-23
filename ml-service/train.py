import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODEL_PATH = 'model.joblib'


def generate_data(samples=2000, random_state=42):
  rng = np.random.default_rng(random_state)

  age = rng.integers(18, 86, size=samples)
  bmi = rng.normal(27, 5, size=samples).clip(16, 45)
  bp_systolic = rng.normal(126, 18, size=samples).clip(90, 220)
  bp_diastolic = rng.normal(81, 11, size=samples).clip(50, 130)
  glucose = rng.normal(110, 30, size=samples).clip(60, 320)
  heart_rate = rng.normal(78, 14, size=samples).clip(40, 180)
  smoking = rng.integers(0, 2, size=samples)
  alcohol = rng.integers(0, 2, size=samples)
  physical_activity = rng.integers(0, 3, size=samples)  # 0 low, 1 medium, 2 high
  gender = rng.integers(0, 2, size=samples)  # 1 male, 0 non-male

  risk_signal = (
    0.018 * age
    + 0.055 * bmi
    + 0.022 * (bp_systolic - 120)
    + 0.028 * (glucose - 100)
    + 0.015 * (heart_rate - 75)
    + 0.75 * smoking
    + 0.30 * alcohol
    - 0.35 * physical_activity
    + 0.10 * gender
    + rng.normal(0, 1.2, size=samples)
  )

  threshold = np.percentile(risk_signal, 58)
  y = (risk_signal > threshold).astype(int)

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
    gender
  ])

  return X, y


def train_model():
  X, y = generate_data()
  X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

  pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LogisticRegression(max_iter=1000))
  ])

  pipeline.fit(X_train, y_train)
  accuracy = pipeline.score(X_test, y_test)
  joblib.dump(pipeline, MODEL_PATH)
  print(f'Model trained and saved to {MODEL_PATH}. Validation accuracy: {accuracy:.3f}')


if __name__ == '__main__':
  train_model()
