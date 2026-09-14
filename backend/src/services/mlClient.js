import axios from 'axios';

const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const requestPrediction = async (payload, requestId) => {
  const response = await axios.post(`${mlServiceUrl}/predict`, payload, {
    timeout: 10000,
    headers: requestId ? { 'x-request-id': requestId } : undefined
  });
  return response.data;
};
