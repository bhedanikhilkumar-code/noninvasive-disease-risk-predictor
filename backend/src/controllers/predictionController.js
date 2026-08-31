import Prediction from '../models/Prediction.js';
import { requestPrediction } from '../services/mlClient.js';
import { validatePredictionInput, validateSessionId } from '../middleware/validation.js';

const sanitizeError = (error) => {
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return error.response.data?.detail || error.response.data?.message || 'Invalid prediction request';
  }
  return 'Prediction service is temporarily unavailable';
};

const getSessionId = (req, res) => {
  const sessionId = req.query.session_id || req.body?.session_id;
  if (!validateSessionId(sessionId)) {
    res.status(400).json({ message: 'A valid session_id is required.' });
    return null;
  }
  return sessionId;
};

export const createPrediction = async (req, res) => {
  try {
    const errors = validatePredictionInput(req.body);
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const normalizedInput = {
      ...req.body,
      gender: req.body.gender.trim().toLowerCase(),
      physical_activity: req.body.physical_activity.trim().toLowerCase()
    };

    const { session_id: sessionId, ...mlPayload } = normalizedInput;
    const output = await requestPrediction(mlPayload);
    const saved = await Prediction.create({
      session_id: sessionId,
      input: mlPayload,
      output
    });

    res.set('Cache-Control', 'no-store');
    return res.status(201).json(saved);
  } catch (error) {
    const status = error?.response?.status >= 400 && error?.response?.status < 500 ? 422 : 503;
    return res.status(status).json({ message: sanitizeError(error) });
  }
};

export const getHistory = async (req, res) => {
  try {
    const sessionId = getSessionId(req, res);
    if (!sessionId) return;

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const requestedSkip = Number.parseInt(req.query.skip, 10);
    const limit = Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, 50);
    const skip = Math.max(Number.isFinite(requestedSkip) ? requestedSkip : 0, 0);

    const rows = await Prediction.find({ session_id: sessionId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.set('Cache-Control', 'no-store');
    return res.json(rows);
  } catch (_error) {
    return res.status(503).json({ message: 'Unable to fetch history right now.' });
  }
};

export const getStats = async (req, res) => {
  try {
    const sessionId = getSessionId(req, res);
    if (!sessionId) return;

    const match = { $match: { session_id: sessionId } };
    const [levelAgg, avgAgg, last7Days] = await Promise.all([
      Prediction.aggregate([
        match,
        { $group: { _id: '$output.level', count: { $sum: 1 } } }
      ]),
      Prediction.aggregate([
        match,
        { $group: { _id: null, avgScore: { $avg: '$output.score' }, total: { $sum: 1 } } }
      ]),
      Prediction.countDocuments({
        session_id: sessionId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const byLevel = { Low: 0, Medium: 0, High: 0 };
    levelAgg.forEach((item) => {
      if (byLevel[item._id] !== undefined) byLevel[item._id] = item.count;
    });

    const summary = avgAgg[0] || { avgScore: 0, total: 0 };

    res.set('Cache-Control', 'no-store');
    return res.json({
      total: summary.total,
      avgScore: Number((summary.avgScore || 0).toFixed(2)),
      byLevel,
      last7Days
    });
  } catch (_error) {
    return res.status(503).json({ message: 'Unable to fetch dashboard statistics right now.' });
  }
};
