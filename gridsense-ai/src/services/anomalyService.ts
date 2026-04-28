import { api } from './api';
import { AnomalyFlag, AnomalyFilters, DismissPayload } from '../types/meter';
import { AxiosResponse } from 'axios';

export const anomalyService = {
  getAll: (filters: Partial<AnomalyFilters>) =>
    api.get<AnomalyFlag[]>('/api/anomalies/', { params: filters }).then((r: AxiosResponse<AnomalyFlag[]>) => r.data),

  getById: (id: string) =>
    api.get<AnomalyFlag>(`/api/anomalies/${id}`).then((r: AxiosResponse<AnomalyFlag>) => r.data),

  dismiss: (id: string, payload: DismissPayload) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/dismiss`, payload).then((r: AxiosResponse<AnomalyFlag>) => r.data),

  confirm: (id: string) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/confirm`).then((r: AxiosResponse<AnomalyFlag>) => r.data),

  review: (id: string) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/review`).then((r: AxiosResponse<AnomalyFlag>) => r.data),

  runScan: () =>
    api.post('/api/anomalies/run-scan').then((r: AxiosResponse) => r.data),

  getStats: () =>
    api.get('/api/anomalies/stats').then((r: AxiosResponse) => r.data),
};
