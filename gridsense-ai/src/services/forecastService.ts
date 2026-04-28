import { api } from './api';

export const forecastService = {
  getAll: (params?: { zone_id?: string, risk_level?: string }) => 
    api.get('/api/forecasts/', { params }).then(r => r.data),
    
  runForecasts: () => api.post('/api/forecasts/run').then(r => r.data),
  
  getAccuracy: () => api.get('/api/forecasts/accuracy').then(r => r.data),
};
