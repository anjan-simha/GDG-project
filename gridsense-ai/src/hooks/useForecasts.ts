import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forecastService } from '../services/forecastService';
import { useToastStore } from '../store/useToastStore';

export function useForecasts(filters?: { zone_id?: string, risk_level?: string }) {
  return useQuery({
    queryKey: ['forecasts', filters],
    queryFn: () => forecastService.getAll(filters),
    staleTime: 60_000,
  });
}

export function useForecastAccuracy() {
  return useQuery({
    queryKey: ['forecasts', 'accuracy'],
    queryFn: () => forecastService.getAccuracy(),
    staleTime: 300_000, // 5 minutes
  });
}

export function useRunForecasts() {
  const qc = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: () => forecastService.runForecasts(),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['forecasts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['zones'] });
      addToast(`Successfully generated ${data.count} new forecasts.`, 'success');
    },
    onError: () => addToast('Failed to run forecasts', 'error'),
  });
}
