import { DemandForecast, ZoneRiskLevel } from '../../types/meter';
import { ZONES } from '../../constants/zones';
import { addMinutes, startOfHour } from 'date-fns';
import { DEFAULT_THRESHOLDS } from '../../constants/thresholds';

// [SYNTHETIC DATA]
export function generateForecasts(): (DemandForecast & { isSynthetic: boolean })[] {
  const forecasts: (DemandForecast & { isSynthetic: boolean })[] = [];
  const now = new Date();
  const nextHour = startOfHour(addMinutes(now, 60)); // start forecasting from next hour

  ZONES.forEach(zone => {
    const [baseMin, baseMax] = zone.baseKWh;
    // 4 meters base aggregate roughly
    const zoneBase = ((baseMax + baseMin) / 2) * 4; 

    for (let interval = 0; interval < 48 * 4; interval++) { // 48 hours = 192 intervals
      const forecastTimestamp = addMinutes(nextHour, interval * 15).toISOString();
      const date = new Date(forecastTimestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      const dayMultiplier = dayOfWeek === 0 ? 0.8 : (dayOfWeek === 6 ? 0.9 : 1.0);
      let todMultiplier;
      if (hour >= 23 || hour < 5) todMultiplier = 0.5;
      else if (hour >= 7 && hour < 9) todMultiplier = 1.4;
      else if (hour >= 18 && hour < 21) todMultiplier = 1.6;
      else todMultiplier = 1.1;

      const baseDemand = zoneBase * dayMultiplier * todMultiplier;
      const predictedKWh = baseDemand * (1 + (Math.random() * 0.06 - 0.03)); // small noise

      // Inject 1 high-demand spike per zone randomly
      const isSpike = Math.random() < (1 / 192); // roughly 1 per 48h
      const finalPredicted = isSpike ? predictedKWh * 1.8 : predictedKWh;

      let riskLevel = ZoneRiskLevel.LOW;
      if (finalPredicted > DEFAULT_THRESHOLDS.criticalKWh) riskLevel = ZoneRiskLevel.CRITICAL;
      else if (finalPredicted > DEFAULT_THRESHOLDS.highKWh) riskLevel = ZoneRiskLevel.HIGH;
      else if (finalPredicted > DEFAULT_THRESHOLDS.moderateKWh) riskLevel = ZoneRiskLevel.MODERATE;

      forecasts.push({
        zoneId: zone.id,
        forecastTimestamp,
        predictedKWh: finalPredicted,
        confidenceLow: finalPredicted * 0.9,
        confidenceHigh: finalPredicted * 1.1,
        riskLevel,
        baselineKWh: baseDemand,
        isSynthetic: true
      });
    }
  });

  return forecasts;
}
