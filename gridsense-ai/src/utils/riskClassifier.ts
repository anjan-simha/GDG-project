import { ZoneRiskLevel, ZoneSummary } from '../types/meter';
import { ThresholdConfig } from '../constants/thresholds';

export function classifyZoneRisk(zone: ZoneSummary, thresholds: ThresholdConfig): ZoneRiskLevel {
  if (zone.currentLoad > thresholds.criticalKWh || zone.activeAnomalyCount >= 3 || zone.hasTamperSuspected) {
    return ZoneRiskLevel.CRITICAL;
  }
  
  if (zone.currentLoad > thresholds.highKWh || (zone.forecastLoad > thresholds.highKWh && zone.peakHoursRemaining < 2) || zone.activeAnomalyCount >= 2) {
    return ZoneRiskLevel.HIGH;
  }

  if (zone.currentLoad > thresholds.moderateKWh || zone.activeAnomalyCount >= 1 || zone.forecastDeviation > 20) {
    return ZoneRiskLevel.MODERATE;
  }

  return ZoneRiskLevel.LOW;
}
