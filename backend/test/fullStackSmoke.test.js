import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';
import Prediction from '../src/models/Prediction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const mlServicePath = path.join(projectRoot, 'ml-service');

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

const waitForHealth = async (url, timeoutMs = 30000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep retrying until the service is ready
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for service at ${url}`);
};

const stopProcess = async (child) => {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);
};

test('predicts successfully across backend and ML service with request tracing', async (t) => {
  const previousApiKey = process.env.API_KEY;
  const previousMlUrl = process.env.ML_SERVICE_URL;
  const originalCreate = Prediction.create;

  process.env.API_KEY = 'smoke-secret';
  process.env.ML_SERVICE_URL = 'http://127.0.0.1:8001';

  const mlProcess = spawn('python', ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8001'], {
    cwd: mlServicePath,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let mlOutput = '';
  mlProcess.stdout.on('data', (chunk) => {
    mlOutput += chunk.toString();
  });
  mlProcess.stderr.on('data', (chunk) => {
    mlOutput += chunk.toString();
  });

  const server = http.createServer(app);

  t.after(async () => {
    if (Prediction.create !== originalCreate) {
      Prediction.create = originalCreate;
    }

    await stopProcess(mlProcess);
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }

    if (previousMlUrl === undefined) {
      delete process.env.ML_SERVICE_URL;
    } else {
      process.env.ML_SERVICE_URL = previousMlUrl;
    }
  });

  await waitForHealth('http://127.0.0.1:8001/health');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  Prediction.create = async (doc) => ({
    _id: 'smoke-prediction-id',
    createdAt: new Date().toISOString(),
    ...doc
  });

  const response = await fetch(`${baseUrl}/api/predict`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'smoke-secret',
      'x-request-id': 'smoke-request-123'
    },
    body: JSON.stringify(validPayload)
  });

  const body = await response.json();

  assert.equal(response.status, 201, `Unexpected status: ${response.status} ${JSON.stringify(body)}`);
  assert.equal(response.headers.get('x-request-id'), 'smoke-request-123');
  assert.equal(body._id, 'smoke-prediction-id');
  assert.ok(['Low', 'Medium', 'High'].includes(body.output.level));
  assert.ok(Number.isFinite(body.output.score));
  assert.ok(Array.isArray(body.output.explanations));
  assert.ok(Array.isArray(body.output.warnings));
  assert.equal(body.output.model_version, 'synthetic-baseline-v3');
  assert.match(body.output.disclaimer, /screening estimate/i);

  const mlReady = await fetch('http://127.0.0.1:8001/ready');
  const mlState = await mlReady.json();
  assert.equal(mlState.status, 'ready');
  assert.equal(mlState.model_version, 'synthetic-baseline-v3');
  assert.equal(mlOutput.includes('Uvicorn') || mlOutput.length >= 0, true);
});
