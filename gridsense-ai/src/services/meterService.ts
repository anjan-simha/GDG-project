import { api } from './api';

export const meterService = {
  getById: (id: string) => api.get(`/api/meters/${id}`).then(r => r.data),
  
  getReadings: (id: string, params?: { page?: number, limit?: number, start?: string, end?: string }) => 
    api.get(`/api/meters/${id}/readings`, { params }).then(r => r.data),
    
  getAnomalies: (id: string) => api.get(`/api/meters/${id}/anomalies`).then(r => r.data),
  
  getBaseline: (id: string) => api.get(`/api/meters/${id}/baseline`).then(r => r.data),
};
