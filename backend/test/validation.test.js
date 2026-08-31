import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePredictionInput } from '../src/middleware/validation.js';

const validPayload = {
  session_id: '550e8400-e29b-41d4-a716-446655440000',
  age: 30,
  gender: 'male',
  bmi: 24,
  bp_systolic: 120,
  bp_diastolic: 80,
  glucose: 95,
  heart_rate: 75,
  smoking: false,
  alcohol: false,
  physical_activity: 'medium',
  symptoms_text: 'fatigue'
};

test('accepts a valid prediction payload', () => {
  assert.deepEqual(validatePredictionInput(validPayload), []);
});

test('rejects out-of-range vitals', () => {
  const errors = validatePredictionInput({ ...validPayload, age: 140, glucose: 999 });
  assert.ok(errors.some((error) => error.includes('age')));
  assert.ok(errors.some((error) => error.includes('glucose')));
});

test('rejects malformed session IDs and oversized symptom text', () => {
  const errors = validatePredictionInput({
    ...validPayload,
    session_id: 'not-a-session',
    symptoms_text: 'x'.repeat(1001)
  });
  assert.ok(errors.some((error) => error.includes('session_id')));
  assert.ok(errors.some((error) => error.includes('1000')));
});
