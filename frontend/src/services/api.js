import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`
});

export const postPrediction = async (payload) => {
  const { data } = await api.post('/predict', payload);
  return data;
};

export const fetchHistory = async (limit = 50, skip = 0) => {
  const { data } = await api.get('/history', { params: { limit, skip } });
  return data;
};

export const fetchStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};
