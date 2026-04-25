import { api } from './api';

export const dashboardService = {
  getSummary: () => api.get('/api/dashboard/summary').then(r => r.data),
  
  getZoneGrid: () => api.get('/api/dashboard/zone-grid').then(r => r.data),
  
  getRecentFlags: () => api.get('/api/dashboard/recent-flags').then(r => r.data),
  
  getSystemStatus: () => api.get('/api/dashboard/system-status').then(r => r.data),
};
