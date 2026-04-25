import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyService } from '../services/anomalyService';
import { AnomalyFilters, DismissPayload } from '../types/meter';
import { useToastStore } from '../store/useToastStore';

export function useAnomalies(filters: Partial<AnomalyFilters>) {
  return useQuery({
    queryKey: ['anomalies', filters],
    queryFn: () => anomalyService.getAll(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAnomalyStats() {
  return useQuery({
    queryKey: ['anomalies', 'stats'],
    queryFn: () => anomalyService.getStats(),
    staleTime: 60_000,
  });
}

export function useDismissFlag() {
  const qc = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DismissPayload }) =>
      anomalyService.dismiss(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomalies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Anomaly successfully dismissed', 'success');
    },
    onError: () => addToast('Failed to dismiss anomaly', 'error'),
  });
}

export function useConfirmFlag() {
  const qc = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: (id: string) => anomalyService.confirm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomalies'] });
      addToast('Anomaly successfully confirmed', 'success');
    },
    onError: () => addToast('Failed to confirm anomaly', 'error'),
  });
}

export function useReviewFlag() {
  const qc = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: (id: string) => anomalyService.review(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomalies'] });
      addToast('Anomaly flagged for review', 'info');
    },
    onError: () => addToast('Failed to set anomaly for review', 'error'),
  });
}

export function useRunAnomalyScan() {
  const qc = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: () => anomalyService.runScan(),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['anomalies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (data.count > 0) {
        addToast(`Scan completed. Found ${data.count} new anomalies.`, 'warning');
      } else {
        addToast('Scan completed. No new anomalies found.', 'success');
      }
    },
    onError: () => addToast('Failed to run anomaly scan', 'error'),
  });
}
