import { api } from './api';
import { AxiosResponse } from 'axios';

export const meterService = {
  getById: (id: string) => api.get(`/api/meters/${id}`).then((r: AxiosResponse) => r.data),
  
  getReadings: (id: string, params?: { page?: number, limit?: number, start?: string, end?: string }) => 
    api.get(`/api/meters/${id}/readings`, { params }).then((r: AxiosResponse) => r.data),
    
  getAnomalies: (id: string) => api.get(`/api/meters/${id}/anomalies`).then((r: AxiosResponse) => r.data),
  
  getBaseline: (id: string) => api.get(`/api/meters/${id}/baseline`).then((r: AxiosResponse) => r.data),
};
