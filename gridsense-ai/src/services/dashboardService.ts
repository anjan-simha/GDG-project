import { api } from './api';
import { AxiosResponse } from 'axios';

export const dashboardService = {
  getSummary: () => api.get('/api/dashboard/summary').then((r: AxiosResponse) => r.data),
  
  getZoneGrid: () => api.get('/api/dashboard/zone-grid').then((r: AxiosResponse) => r.data),
  
  getRecentFlags: () => api.get('/api/dashboard/recent-flags').then((r: AxiosResponse) => r.data),
  
  getSystemStatus: () => api.get('/api/dashboard/system-status').then((r: AxiosResponse) => r.data),
};
