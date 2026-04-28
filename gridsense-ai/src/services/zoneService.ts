import { api } from './api';
import { AxiosResponse } from 'axios';

export const zoneService = {
  getAll: () => api.get('/api/zones/').then((r: AxiosResponse) => r.data),
  
  getById: (id: string) => api.get(`/api/zones/${id}`).then((r: AxiosResponse) => r.data),
  
  getMeters: (id: string) => api.get(`/api/zones/${id}/meters`).then((r: AxiosResponse) => r.data),
  
  getReadings: (id: string, params?: { start?: string, end?: string }) => 
    api.get(`/api/zones/${id}/readings`, { params }).then((r: AxiosResponse) => r.data),
    
  getForecasts: (id: string, horizon: string = '24h') => 
    api.get(`/api/zones/${id}/forecasts`, { params: { horizon } }).then((r: AxiosResponse) => r.data),
    
  getAnomalies: (id: string) => api.get(`/api/zones/${id}/anomalies`).then((r: AxiosResponse) => r.data),
  
  getRiskHistory: (id: string) => api.get(`/api/zones/${id}/risk-history`).then((r: AxiosResponse) => r.data),
};
