import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardService.getSummary(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useDashboardZoneGrid() {
  return useQuery({
    queryKey: ['dashboard', 'zone-grid'],
    queryFn: () => dashboardService.getZoneGrid(),
    staleTime: 60_000,
  });
}

export function useDashboardRecentFlags() {
  return useQuery({
    queryKey: ['dashboard', 'recent-flags'],
    queryFn: () => dashboardService.getRecentFlags(),
    staleTime: 30_000,
  });
}

export function useDashboardSystemStatus() {
  return useQuery({
    queryKey: ['dashboard', 'system-status'],
    queryFn: () => dashboardService.getSystemStatus(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
