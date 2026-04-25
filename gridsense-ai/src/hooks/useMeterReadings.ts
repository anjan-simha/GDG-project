import { useQuery } from '@tanstack/react-query';
import { meterService } from '../services/meterService';

export function useMeter(id: string) {
  return useQuery({
    queryKey: ['meter', id],
    queryFn: () => meterService.getById(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useMeterReadings(id: string, params?: { page?: number, limit?: number, start?: string, end?: string }) {
  return useQuery({
    queryKey: ['meter', id, 'readings', params],
    queryFn: () => meterService.getReadings(id, params),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useMeterAnomalies(id: string) {
  return useQuery({
    queryKey: ['meter', id, 'anomalies'],
    queryFn: () => meterService.getAnomalies(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useMeterBaseline(id: string) {
  return useQuery({
    queryKey: ['meter', id, 'baseline'],
    queryFn: () => meterService.getBaseline(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}
