import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictionAPI = {
  // Health check
  health: () => api.get('/health'),
  
  // Make prediction
  predict: (data) => api.post('/predict', data),
  
  // Get feature values
  getFeatures: () => api.get('/features'),
  
  // Get dataset statistics
  getStats: () => api.get('/stats'),
};

export default api;