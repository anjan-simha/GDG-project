import { MeterReading } from '../../types/meter';
import { ZONES } from '../../constants/zones';
import { addMinutes, subDays, startOfDay } from 'date-fns';

// [SYNTHETIC DATA]
export function injectAnomalies(readings: MeterReading[]): MeterReading[] {
  const newReadings = [...readings];
  
  // Create a map for quick lookup
  const readingMap = new Map<string, MeterReading>();
  newReadings.forEach(r => readingMap.set(`${r.meterId}_${r.timestamp}`, r));

  const now = new Date();
  const startDate = startOfDay(subDays(now, 7));

  // 1. SUDDEN_DROP: 3 meters show 70–90% drop for 4–8 intervals
  const dropMeters = [`${ZONES[0].id}-M01`, `${ZONES[1].id}-M02`, `${ZONES[2].id}-M03`];
  dropMeters.forEach(meterId => {
    const dropStartInterval = Math.floor(Math.random() * 80); // some interval
    const dropDay = Math.floor(Math.random() * 6);
    const dropStartTs = addMinutes(startDate, dropDay * 24 * 60 + dropStartInterval * 15);
    
    for (let i = 0; i < 6; i++) {
       const ts = addMinutes(dropStartTs, i * 15).toISOString();
       const r = readingMap.get(`${meterId}_${ts}`);
       if (r) r.consumptionKWh *= 0.2; // 80% drop
    }
  });

  // 2. SUDDEN_SPIKE: 2 meters show 200–300% above baseline for 2–4 intervals
  const spikeMeters = [`${ZONES[3].id}-M01`, `${ZONES[4].id}-M02`];
  spikeMeters.forEach(meterId => {
    const spikeStartTs = addMinutes(startDate, 3 * 24 * 60 + 40 * 15);
    for (let i = 0; i < 3; i++) {
       const ts = addMinutes(spikeStartTs, i * 15).toISOString();
       const r = readingMap.get(`${meterId}_${ts}`);
       if (r) r.consumptionKWh *= 2.5;
    }
  });

  // 3. CONSISTENT_UNDERREPORT: 1 meter 20% below
  const underReportMeter = `${ZONES[5].id}-M01`;
  newReadings.forEach(r => {
    if (r.meterId === underReportMeter) {
      r.consumptionKWh *= 0.8;
    }
  });

  // 4. NIGHT_USAGE_ANOMALY: 2 meters unusual 1am-4am
  const nightMeters = [`${ZONES[6].id}-M02`, `${ZONES[7].id}-M03`];
  newReadings.forEach(r => {
    if (nightMeters.includes(r.meterId)) {
      const hour = new Date(r.timestamp).getHours();
      if (hour >= 1 && hour < 4) {
        r.consumptionKWh *= 3.0; // unusual spike
      }
    }
  });

  // 5. PEER_DEVIATION: 4 meters >2 stdev
  const devMeters = [`${ZONES[8].id}-M04`, `${ZONES[9].id}-M01`, `${ZONES[10].id}-M02`, `${ZONES[11].id}-M03`];
  newReadings.forEach(r => {
    if (devMeters.includes(r.meterId)) {
       r.consumptionKWh *= 1.8; // consistent high usage
    }
  });

  // 6. TAMPER_SUSPECTED: CONSISTENT_UNDERREPORT + SUDDEN_DROP
  const tamperMeter = `${ZONES[11].id}-M04`;
  newReadings.forEach(r => {
    if (r.meterId === tamperMeter) {
      r.consumptionKWh *= 0.75; // consistent underreport
      
      const day = new Date(r.timestamp).getDay();
      const hour = new Date(r.timestamp).getHours();
      // Drop pattern on one specific day
      if (day === 3 && hour >= 12 && hour <= 14) {
        r.consumptionKWh *= 0.1; // extreme drop
      }
    }
  });

  return newReadings;
}
