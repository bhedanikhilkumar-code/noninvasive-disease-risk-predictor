import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import predictionRoutes from './routes/predictionRoutes.js';
import { connectDatabase } from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  })
);
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    database: ready ? 'connected' : 'disconnected'
  });
});
app.use('/api', predictionRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, _req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (error instanceof SyntaxError && error.status === 400 && error.body) {
    return res.status(400).json({ message: 'Request body contains invalid JSON' });
  }
  return next(error);
});

app.use((error, _req, res, _next) => {
  console.error(`Unhandled server error: ${error.message}`);
  res.status(500).json({ message: 'Internal server error' });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });
