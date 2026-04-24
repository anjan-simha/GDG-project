import { ZONES } from '../../constants/zones';
import { DEFAULT_THRESHOLDS } from '../../constants/thresholds';
import { generateMeterReadings } from './generateMeterReadings';
import { generateForecasts } from './generateForecasts';
import { injectAnomalies } from './injectAnomalies';
import { runAllDetectors } from '../../utils/anomalyDetectors';
import { ZoneRiskLevel, ZoneSummary, AnomalyFlag } from '../../types/meter';

// [SYNTHETIC DATA]
export function seedGridSenseData() {
  console.log(`[GRIDSENSE AI] ⚡ Running on SYNTHETIC data only. No real BESCOM data in use.`);

  const zones: ZoneSummary[] = ZONES.map(z => ({
    id: z.id,
    name: z.name,
    currentLoad: (z.baseKWh[0] + z.baseKWh[1]) / 2 * 4,
    forecastLoad: (z.baseKWh[0] + z.baseKWh[1]) / 2 * 4 * 1.1,
    peakHoursRemaining: 3,
    activeAnomalyCount: 0,
    hasTamperSuspected: false,
    forecastDeviation: Math.random() * 10,
    riskLevel: ZoneRiskLevel.LOW
  }));

  const rawReadings = generateMeterReadings();
  const readings = injectAnomalies(rawReadings);
  const forecasts = generateForecasts();
  
  const anomalyFlags = runAllDetectors(readings, DEFAULT_THRESHOLDS);

  // Update active anomaly counts
  anomalyFlags.forEach((flag: AnomalyFlag) => {
    const zone = zones.find(z => z.id === flag.zoneId);
    if (zone) {
      zone.activeAnomalyCount++;
      if (flag.anomalyType === 'TAMPER_SUSPECTED') {
        zone.hasTamperSuspected = true;
      }
    }
  });

  return {
    zones,
    readings,
    forecasts,
    anomalyFlags
  };
}
