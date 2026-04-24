export interface MeterReading {
  meterId: string;
  zoneId: string;
  timestamp: string;
  consumptionKWh: number;
  voltageV?: number;
  currentA?: number;
  powerFactorPF?: number;
  isSynthetic: boolean;
}

export interface DemandForecast {
  zoneId: string;
  forecastTimestamp: string;
  predictedKWh: number;
  confidenceLow: number;
  confidenceHigh: number;
  riskLevel: ZoneRiskLevel;
  baselineKWh: number;
}

export enum ZoneRiskLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface AnomalyFlag {
  flagId: string;
  meterId: string;
  zoneId: string;
  detectedAt: string;
  anomalyType: AnomalyType;
  severityScore: number;
  explanation: string;
  contributingFeatures: string[];
  baselineDeviation: number;
  estimatedFalsePositiveRisk: FalsePositiveRisk;
  status: AnomalyStatus;
}

export enum AnomalyType {
  SUDDEN_DROP = "SUDDEN_DROP",
  SUDDEN_SPIKE = "SUDDEN_SPIKE",
  CONSISTENT_UNDERREPORT = "CONSISTENT_UNDERREPORT",
  NIGHT_USAGE_ANOMALY = "NIGHT_USAGE_ANOMALY",
  PEER_DEVIATION = "PEER_DEVIATION",
  TAMPER_SUSPECTED = "TAMPER_SUSPECTED",
}

export enum AnomalyStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  DISMISSED = "DISMISSED",
  CONFIRMED = "CONFIRMED",
}

export enum FalsePositiveRisk {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface ZoneSummary {
  id: string;
  name: string;
  currentLoad: number;
  forecastLoad: number; // next hour
  peakHoursRemaining: number;
  activeAnomalyCount: number;
  hasTamperSuspected: boolean;
  forecastDeviation: number;
  riskLevel: ZoneRiskLevel;
}
