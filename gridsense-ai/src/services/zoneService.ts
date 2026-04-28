import { api } from './api';

export const zoneService = {
  getAll: () => api.get('/api/zones/').then(r => r.data),
  
  getById: (id: string) => api.get(`/api/zones/${id}`).then(r => r.data),
  
  getMeters: (id: string) => api.get(`/api/zones/${id}/meters`).then(r => r.data),
  
  getReadings: (id: string, params?: { start?: string, end?: string }) => 
    api.get(`/api/zones/${id}/readings`, { params }).then(r => r.data),
    
  getForecasts: (id: string, horizon: string = '24h') => 
    api.get(`/api/zones/${id}/forecasts`, { params: { horizon } }).then(r => r.data),
    
  getAnomalies: (id: string) => api.get(`/api/zones/${id}/anomalies`).then(r => r.data),
  
  getRiskHistory: (id: string) => api.get(`/api/zones/${id}/risk-history`).then(r => r.data),
};
