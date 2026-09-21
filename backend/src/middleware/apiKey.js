export const requireApiKey = (req, res, next) => {
  const configuredApiKey = process.env.API_KEY;

  if (!configuredApiKey) {
    return next();
  }

  const suppliedApiKey = req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!suppliedApiKey || suppliedApiKey !== configuredApiKey) {
    return res.status(401).json({ message: 'API key required' });
  }

  return next();
};
