import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePredictionInput, validatePredictionOutput } from '../src/middleware/validation.js';
import { predictionRateLimit } from '../src/middleware/rateLimit.js';

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

test('accepts a complete ML prediction response', () => {
  assert.deepEqual(validatePredictionOutput({
    score: 42.5,
    level: 'Medium',
    explanations: ['Elevated glucose may contribute to risk.'],
    warnings: [],
    model_version: 'synthetic-baseline-v3',
    disclaimer: 'Screening estimate only.'
  }), []);
});

test('rejects malformed ML prediction responses', () => {
  const errors = validatePredictionOutput({
    score: 140,
    level: 'Unknown',
    explanations: ['ok', 42],
    warnings: 'none',
    model_version: '',
    disclaimer: null
  });

  assert.ok(errors.includes('Prediction score must be between 0 and 100.'));
  assert.ok(errors.includes('Prediction level is invalid.'));
  assert.ok(errors.includes('Prediction explanations must be an array of strings.'));
  assert.ok(errors.includes('Prediction warnings must be an array of strings.'));
  assert.ok(errors.includes('Prediction model_version is required.'));
  assert.ok(errors.includes('Prediction disclaimer is required.'));
});

test('limits repeated prediction requests from one client', () => {
  const ip = `test-${Date.now()}-${Math.random()}`;
  let nextCalls = 0;
  let statusCode;
  let responseBody;
  let retryAfter;

  for (let index = 0; index < 31; index += 1) {
    const response = {
      setHeader: (name, value) => {
        if (name === 'Retry-After') retryAfter = value;
      },
      status: (value) => {
        statusCode = value;
        return response;
      },
      json: (body) => {
        responseBody = body;
      }
    };

    predictionRateLimit(
      { ip },
      response,
      () => {
        nextCalls += 1;
      }
    );
  }

  assert.equal(nextCalls, 30);
  assert.equal(statusCode, 429);
  assert.equal(responseBody.message, 'Too many prediction requests. Please try again later.');
  assert.ok(retryAfter > 0);
});
