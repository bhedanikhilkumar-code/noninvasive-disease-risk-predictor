import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

const request = async (path, options = {}) => {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const request = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (response) => {
        let rawBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          rawBody += chunk;
        });
        response.on('end', () => {
          resolve({
            response: {
              status: response.statusCode,
              headers: {
                get: (name) => response.headers[name.toLowerCase()] || null
              }
            },
            body: JSON.parse(rawBody)
          });
        });
      }
    );

    request.on('error', reject);
    if (options.body) request.write(options.body);
    request.end();
  });
};

test('returns liveness and request ID headers', async () => {
  const { response, body } = await request('/health', {
    headers: { 'x-request-id': 'integration-health-1' }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });
  assert.equal(response.headers.get('x-request-id'), 'integration-health-1');
});

test('reports database readiness separately from liveness', async () => {
  const { response, body } = await request('/ready');

  assert.equal(response.status, 503);
  assert.deepEqual(body, { status: 'not_ready', database: 'disconnected' });
});

test('returns structured responses for unknown routes and malformed JSON', async () => {
  const unknown = await request('/does-not-exist');
  assert.equal(unknown.response.status, 404);
  assert.deepEqual(unknown.body, { message: 'Route not found' });

  const malformed = await request('/api/predict', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"age":'
  });
  assert.equal(malformed.response.status, 400);
  assert.deepEqual(malformed.body, { message: 'Request body contains invalid JSON' });
});

test('rejects oversized request bodies before prediction processing', async () => {
  const oversized = await request('/api/predict', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ symptoms_text: 'x'.repeat(33 * 1024) })
  });

  assert.equal(oversized.response.status, 413);
  assert.deepEqual(oversized.body, { message: 'Request body is too large' });
});

test('requires API key when configured before accepting prediction requests', async () => {
  const previousApiKey = process.env.API_KEY;
  process.env.API_KEY = 'super-secret';

  try {
    const withoutKey = await request('/api/predict', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
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
        symptoms_text: 'no current symptoms'
      })
    });

    assert.equal(withoutKey.response.status, 401);
    assert.deepEqual(withoutKey.body, { message: 'API key required' });

    const withKey = await request('/api/predict', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'super-secret'
      },
      body: JSON.stringify({
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
        symptoms_text: 'no current symptoms'
      })
    });

    assert.equal(withKey.response.status, 502);
    assert.deepEqual(withKey.body, { message: 'Prediction service unavailable' });
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }
  }
});

test('handles delete history requests appropriately when database is disconnected', async () => {
  const res = await request('/api/history/65a123456789012345678901', { method: 'DELETE' });
  assert.equal(res.response.status, 503);
  assert.deepEqual(res.body, { message: 'Database unavailable' });
});

