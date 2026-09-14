import Prediction from '../models/Prediction.js';
import { requestPrediction } from '../services/mlClient.js';
import { validatePredictionInput, validatePredictionOutput } from '../middleware/validation.js';

export const createPrediction = async (req, res) => {
  try {
    const errors = validatePredictionInput(req.body);
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const normalizedInput = {
      ...req.body,
      gender: req.body.gender.toLowerCase(),
      physical_activity: req.body.physical_activity.toLowerCase()
    };

    const output = await requestPrediction(normalizedInput);
    const outputErrors = validatePredictionOutput(output);
    if (outputErrors.length) {
      console.error(`Invalid ML response: ${outputErrors.join(', ')}`);
      return res.status(502).json({ message: 'Invalid prediction service response' });
    }
    const saved = await Prediction.create({ input: normalizedInput, output });

    return res.status(201).json(saved);
  } catch (error) {
    console.error(`[${req.requestId}] Prediction failed: ${error.message}`);
    return res.status(502).json({ message: 'Prediction service unavailable' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const rows = await Prediction.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return res.json(rows);
  } catch (error) {
    console.error(`[${req.requestId}] Unable to fetch history: ${error.message}`);
    return res.status(500).json({ message: 'Unable to fetch history' });
  }
};

export const getStats = async (_req, res) => {
  try {
    const [levelAgg, avgAgg, last7Days] = await Promise.all([
      Prediction.aggregate([
        { $group: { _id: '$output.level', count: { $sum: 1 } } }
      ]),
      Prediction.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$output.score' }, total: { $sum: 1 } } }
      ]),
      Prediction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const byLevel = { Low: 0, Medium: 0, High: 0 };
    levelAgg.forEach((item) => {
      if (byLevel[item._id] !== undefined) byLevel[item._id] = item.count;
    });

    const summary = avgAgg[0] || { avgScore: 0, total: 0 };

    return res.json({
      total: summary.total,
      avgScore: Number((summary.avgScore || 0).toFixed(2)),
      byLevel,
      last7Days
    });
  } catch (error) {
    console.error(`[${req.requestId}] Unable to fetch stats: ${error.message}`);
    return res.status(500).json({ message: 'Unable to fetch stats' });
  }
};
