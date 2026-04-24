export interface ThresholdConfig {
  criticalKWh: number;
  highKWh: number;
  moderateKWh: number;
  dropThreshold: number;
  spikeThreshold: number;
  peerZScoreThreshold: number;
  consecutiveIntervalsForFlag: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  criticalKWh: 300,
  highKWh: 200,
  moderateKWh: 120,
  dropThreshold: 0.60,
  spikeThreshold: 1.50,
  peerZScoreThreshold: 2.0,
  consecutiveIntervalsForFlag: 4,
};
