import { useMutation } from '@tanstack/react-query';
import { intelligenceService } from '../services/intelligenceService';

/** Enriches a single anomaly flag's explanation via Gemini. */
export function useEnrichFlag() {
  return useMutation({
    mutationFn: (flagId: string) => intelligenceService.enrichFlag(flagId),
  });
}

/** Sends a natural language question to the GridSense Q&A engine. */
export function useAskOperator() {
  return useMutation({
    mutationFn: (question: string) => intelligenceService.ask(question),
  });
}

/** Generates a full inspection report for a zone using Gemini 1.5 Pro. */
export function useZoneReport() {
  return useMutation({
    mutationFn: (zoneId: string) => intelligenceService.getZoneReport(zoneId),
  });
}

/** Gets a multi-anomaly pattern summary for a zone. */
export function usePatternSummary(zoneId: string) {
  return useMutation({
    mutationFn: () => intelligenceService.getPatternSummary(zoneId),
  });
}
