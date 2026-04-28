import { api } from './api';
import { AnomalyFlag, AnomalyFilters, DismissPayload } from '../types/meter';

export const anomalyService = {
  getAll: (filters: Partial<AnomalyFilters>) =>
    api.get<AnomalyFlag[]>('/api/anomalies/', { params: filters }).then(r => r.data),

  getById: (id: string) =>
    api.get<AnomalyFlag>(`/api/anomalies/${id}`).then(r => r.data),

  dismiss: (id: string, payload: DismissPayload) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/dismiss`, payload).then(r => r.data),

  confirm: (id: string) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/confirm`).then(r => r.data),

  review: (id: string) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/review`).then(r => r.data),

  runScan: () =>
    api.post('/api/anomalies/run-scan').then(r => r.data),

  getStats: () =>
    api.get('/api/anomalies/stats').then(r => r.data),
};
