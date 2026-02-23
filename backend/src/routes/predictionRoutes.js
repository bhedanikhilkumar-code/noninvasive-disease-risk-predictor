import express from 'express';
import { createPrediction, getHistory, getStats } from '../controllers/predictionController.js';

const router = express.Router();

router.post('/predict', createPrediction);
router.get('/history', getHistory);
router.get('/stats', getStats);

export default router;
