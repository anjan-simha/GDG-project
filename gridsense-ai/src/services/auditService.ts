import { api } from './api';
import { AxiosResponse } from 'axios';

export const auditService = {
  getAll: (params?: { action?: string, zone_id?: string, start_date?: string, end_date?: string, page?: number }) => 
    api.get('/api/audit/', { params }).then((r: AxiosResponse) => r.data),
    
  getByFlag: (id: string) => api.get(`/api/audit/flag/${id}`).then((r: AxiosResponse) => r.data),
  
  exportLogs: () => {
    // This is a direct navigation for download since it's a file
    window.location.href = `${api.defaults.baseURL}/api/audit/export`;
  }
};
