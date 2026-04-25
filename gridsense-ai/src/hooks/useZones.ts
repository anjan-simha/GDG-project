import { useQuery } from '@tanstack/react-query';
import { zoneService } from '../services/zoneService';

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneService.getAll(),
    staleTime: 60_000,
  });
}

export function useZoneDetail(id: string) {
  return useQuery({
    queryKey: ['zone', id],
    queryFn: () => zoneService.getById(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useZoneMeters(id: string) {
  return useQuery({
    queryKey: ['zone', id, 'meters'],
    queryFn: () => zoneService.getMeters(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}
