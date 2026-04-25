import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/auditService';

export function useAuditLogs(params?: { action?: string, zone_id?: string, page?: number }) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => auditService.getAll(params),
    staleTime: 60_000,
  });
}

export function useAuditLogByFlag(id: string) {
  return useQuery({
    queryKey: ['audit', 'flag', id],
    queryFn: () => auditService.getByFlag(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}
