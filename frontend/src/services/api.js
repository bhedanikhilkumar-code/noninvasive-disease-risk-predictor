import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const SESSION_KEY = 'disease-risk-session-id';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
};

export const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = createSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const postPrediction = async (payload) => {
  const { data } = await api.post('/predict', { ...payload, session_id: getSessionId() });
  return data;
};

export const fetchHistory = async (limit = 50, skip = 0) => {
  const { data } = await api.get('/history', {
    params: { limit, skip, session_id: getSessionId() }
  });
  return data;
};

export const fetchStats = async () => {
  const { data } = await api.get('/stats', { params: { session_id: getSessionId() } });
  return data;
};
