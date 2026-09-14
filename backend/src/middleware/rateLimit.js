const requests = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export const predictionRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = requests.get(key);

  if (!current || now - current.startedAt >= WINDOW_MS) {
    requests.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      message: 'Too many prediction requests. Please try again later.'
    });
  }

  current.count += 1;
  return next();
};
