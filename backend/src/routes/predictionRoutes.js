import express from 'express';
import { createPrediction, getHistory, getStats } from '../controllers/predictionController.js';
import { predictionRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/predict', predictionRateLimit, createPrediction);
router.get('/history', getHistory);
router.get('/stats', getStats);

export default router;
