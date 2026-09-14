import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePredictionInput } from '../src/middleware/validation.js';

const validPayload = {
  age: 45,
  gender: 'female',
  bmi: 28,
  bp_systolic: 130,
  bp_diastolic: 85,
  glucose: 110,
  heart_rate: 78,
  smoking: false,
  alcohol: false,
  physical_activity: 'medium',
  symptoms_text: 'occasional fatigue'
};

test('accepts a valid prediction payload', () => {
  assert.deepEqual(validatePredictionInput(validPayload), []);
});

test('rejects malformed request bodies', () => {
  assert.deepEqual(validatePredictionInput(null), ['Request body must be a JSON object.']);
  assert.deepEqual(validatePredictionInput([]), ['Request body must be a JSON object.']);
});

test('rejects impossible blood pressure relationships', () => {
  const errors = validatePredictionInput({
    ...validPayload,
    bp_systolic: 100,
    bp_diastolic: 100
  });

  assert.ok(errors.includes('bp_diastolic must be lower than bp_systolic.'));
});

test('rejects unknown fields and oversized symptoms', () => {
  const errors = validatePredictionInput({
    ...validPayload,
    unexpected: true,
    symptoms_text: 'x'.repeat(2001)
  });

  assert.ok(errors.includes('unexpected is not allowed.'));
  assert.ok(errors.includes('symptoms_text must be 2000 characters or fewer.'));
});

test('rejects invalid numeric and enum values', () => {
  const errors = validatePredictionInput({
    ...validPayload,
    age: Number.NaN,
    gender: 'unknown',
    physical_activity: 'unknown'
  });

  assert.ok(errors.includes('age must be between 1 and 120.'));
  assert.ok(errors.includes('gender must be one of: male, female, other.'));
  assert.ok(errors.includes('physical_activity must be one of: low, medium, high.'));
});
