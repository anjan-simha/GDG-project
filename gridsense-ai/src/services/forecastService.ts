import { api } from './api';
import { AxiosResponse } from 'axios';

export const forecastService = {
  getAll: (params?: { zone_id?: string, risk_level?: string }) => 
    api.get('/api/forecasts/', { params }).then((r: AxiosResponse) => r.data),
    
  runForecasts: () => api.post('/api/forecasts/run').then((r: AxiosResponse) => r.data),
  
  getAccuracy: () => api.get('/api/forecasts/accuracy').then((r: AxiosResponse) => r.data),
};
