import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import predictionRoutes from './routes/predictionRoutes.js';
import { connectDatabase } from './config/db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  })
);
app.use(express.json({ limit: '20kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

app.use('/api', predictionRoutes);

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
