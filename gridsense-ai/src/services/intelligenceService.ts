import { api } from './api';
import { AxiosResponse } from 'axios';

export interface EnrichFlagResponse {
  flag_id: string;
  enriched_explanation: string;
  model_used: string;
  fallback_used: boolean;
}

export interface OperatorQAResponse {
  answer: string;
  model_used: string;
}

export interface ZoneReportResponse {
  zone_id: string;
  zone_name: string;
  report_text: string;
  generated_at: string;
  model_used: string;
}

export interface PatternSummaryResponse {
  zone_id: string;
  flag_count: number;
  summary: string;
}

export const intelligenceService = {
  enrichFlag: (flagId: string): Promise<EnrichFlagResponse> =>
    api
      .post('/api/intelligence/enrich-flag', { flag_id: flagId })
      .then((r: AxiosResponse<EnrichFlagResponse>) => r.data),

  ask: (question: string): Promise<OperatorQAResponse> =>
    api
      .post('/api/intelligence/ask', { question })
      .then((r: AxiosResponse<OperatorQAResponse>) => r.data),

  getZoneReport: (zoneId: string): Promise<ZoneReportResponse> =>
    api
      .post('/api/intelligence/zone-report', { zone_id: zoneId })
      .then((r: AxiosResponse<ZoneReportResponse>) => r.data),

  getPatternSummary: (zoneId: string): Promise<PatternSummaryResponse> =>
    api
      .get(`/api/intelligence/zone-pattern/${zoneId}`)
      .then((r: AxiosResponse<PatternSummaryResponse>) => r.data),
};
