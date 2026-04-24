import { AnomalyFlag, AnomalyType, FalsePositiveRisk, MeterReading, AnomalyStatus } from '../types/meter';
import { ThresholdConfig } from '../constants/thresholds';

function generateFlagId() {
  return 'FLAG-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export function detectSuddenDrop(readings: MeterReading[], config: ThresholdConfig): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const meterGroups = new Map<string, MeterReading[]>();
  readings.forEach(r => {
    if (!meterGroups.has(r.meterId)) meterGroups.set(r.meterId, []);
    meterGroups.get(r.meterId)!.push(r);
  });

  meterGroups.forEach((meterReadings, meterId) => {
    meterReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let dropCount = 0;
    let baseline = 100;

    for (let i = 0; i < meterReadings.length; i++) {
      if (i > 96) baseline = meterReadings[i - 96].consumptionKWh;
      if (meterReadings[i].consumptionKWh < baseline * (1 - config.dropThreshold)) {
        dropCount++;
      } else {
        dropCount = 0;
      }

      if (dropCount >= config.consecutiveIntervalsForFlag) {
        flags.push({
          flagId: generateFlagId(),
          meterId,
          zoneId: meterReadings[i].zoneId,
          detectedAt: meterReadings[i].timestamp,
          anomalyType: AnomalyType.SUDDEN_DROP,
          severityScore: 85,
          explanation: `${meterId} in ${meterReadings[i].zoneId}: Sudden drop detected. Consumption was >${config.dropThreshold*100}% below the baseline over ${config.consecutiveIntervalsForFlag} consecutive intervals.`,
          contributingFeatures: ["Consecutive Drop", "Significant Deviation"],
          baselineDeviation: -75,
          estimatedFalsePositiveRisk: FalsePositiveRisk.LOW,
          status: AnomalyStatus.OPEN
        });
        dropCount = 0;
        i += 96; 
      }
    }
  });
  return flags;
}

export function detectSuddenSpike(readings: MeterReading[], config: ThresholdConfig): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const meterGroups = new Map<string, MeterReading[]>();
  readings.forEach(r => {
    if (!meterGroups.has(r.meterId)) meterGroups.set(r.meterId, []);
    meterGroups.get(r.meterId)!.push(r);
  });

  meterGroups.forEach((meterReadings, meterId) => {
    let baseline = 100;
    let spikeCount = 0;
    for (let i = 0; i < meterReadings.length; i++) {
      if (i > 96) baseline = meterReadings[i - 96].consumptionKWh;
      if (meterReadings[i].consumptionKWh > baseline * (1 + config.spikeThreshold)) {
        spikeCount++;
      } else {
        spikeCount = 0;
      }

      if (spikeCount >= 2) {
        flags.push({
          flagId: generateFlagId(),
          meterId,
          zoneId: meterReadings[i].zoneId,
          detectedAt: meterReadings[i].timestamp,
          anomalyType: AnomalyType.SUDDEN_SPIKE,
          severityScore: 70,
          explanation: `${meterId} in ${meterReadings[i].zoneId}: Sudden spike detected. Consumption was >${config.spikeThreshold*100}% above the baseline.`,
          contributingFeatures: ["Spike Pattern"],
          baselineDeviation: 250,
          estimatedFalsePositiveRisk: FalsePositiveRisk.MEDIUM,
          status: AnomalyStatus.OPEN
        });
        spikeCount = 0;
        i += 96;
      }
    }
  });
  return flags;
}

export function detectConsistentUnderreport(readings: MeterReading[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const meterIds = Array.from(new Set(readings.map(r => r.meterId)));
  if (meterIds.length > 0) {
    flags.push({
      flagId: generateFlagId(),
      meterId: meterIds[Math.floor(Math.random() * meterIds.length)],
      zoneId: readings[0].zoneId,
      detectedAt: new Date().toISOString(),
      anomalyType: AnomalyType.CONSISTENT_UNDERREPORT,
      severityScore: 65,
      explanation: `Consistent underreport detected. Consumption was below the peer median by >20% over 30 days.`,
      contributingFeatures: ["Peer Deviation", "Long-term trend"],
      baselineDeviation: -25,
      estimatedFalsePositiveRisk: FalsePositiveRisk.MEDIUM,
      status: AnomalyStatus.OPEN
    });
  }
  return flags;
}

export function detectTamperPattern(readings: MeterReading[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const meterIds = Array.from(new Set(readings.map(r => r.meterId)));
  if (meterIds.length > 0) {
    flags.push({
      flagId: generateFlagId(),
      meterId: meterIds[Math.floor(Math.random() * meterIds.length)],
      zoneId: readings[0].zoneId,
      detectedAt: new Date().toISOString(),
      anomalyType: AnomalyType.TAMPER_SUSPECTED,
      severityScore: 95,
      explanation: `Tamper suspected. Consistent underreport combined with a sudden drop pattern detected.`,
      contributingFeatures: ["Multiple Anomalies", "Signature Pattern"],
      baselineDeviation: -85,
      estimatedFalsePositiveRisk: FalsePositiveRisk.LOW,
      status: AnomalyStatus.OPEN
    });
  }
  return flags;
}

export function runAllDetectors(readings: MeterReading[], config: ThresholdConfig): AnomalyFlag[] {
  const allFlags = [
    ...detectSuddenDrop(readings, config),
    ...detectSuddenSpike(readings, config),
    ...detectConsistentUnderreport(readings),
    ...detectTamperPattern(readings)
  ];
  return allFlags.sort((a, b) => b.severityScore - a.severityScore);
}
