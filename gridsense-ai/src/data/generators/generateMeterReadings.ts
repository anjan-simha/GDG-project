import { MeterReading } from '../../types/meter';
import { ZONES } from '../../constants/zones';
import { addMinutes, startOfDay, subDays } from 'date-fns';

// [SYNTHETIC DATA]
function randomGaussian(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function generateMeterReadings(): MeterReading[] {
  const readings: MeterReading[] = [];
  const now = new Date();
  const startDate = startOfDay(subDays(now, 7)); // 7 days ago

  ZONES.forEach((zone) => {
    // Generate 4 meters
    for (let m = 1; m <= 4; m++) {
      const meterId = `${zone.id}-M0${m}`;
      const [baseMin, baseMax] = zone.baseKWh;
      const meterBase = Math.random() * (baseMax - baseMin) + baseMin;

      for (let day = 0; day < 7; day++) {
        const currentDate = addMinutes(startDate, day * 24 * 60);
        const dayOfWeek = currentDate.getDay();
        const dayMultiplier = dayOfWeek === 0 ? 0.8 : (dayOfWeek === 6 ? 0.9 : 1.0);

        for (let interval = 0; interval < 96; interval++) {
          const timestamp = addMinutes(currentDate, interval * 15).toISOString();
          const hour = Math.floor(interval / 4);
          
          let todMultiplier;
          if (hour >= 23 || hour < 5) todMultiplier = 0.5; // off-peak
          else if (hour >= 7 && hour < 9) todMultiplier = 1.4; // morning peak
          else if (hour >= 18 && hour < 21) todMultiplier = 1.6; // evening peak
          else todMultiplier = 1.1; // midday

          const baseDemand = meterBase * dayMultiplier * todMultiplier;
          const noise = randomGaussian(0, baseDemand * 0.05);
          const consumptionKWh = Math.max(0, baseDemand + noise);

          readings.push({
            meterId,
            zoneId: zone.id,
            timestamp,
            consumptionKWh,
            voltageV: randomGaussian(230, 5),
            currentA: randomGaussian(10, 2),
            powerFactorPF: Math.max(0.7, Math.min(1.0, randomGaussian(0.95, 0.02))),
            isSynthetic: true
          });
        }
      }
    }
  });

  return readings;
}
