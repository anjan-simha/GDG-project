import { create } from 'zustand';
import { ThresholdConfig, DEFAULT_THRESHOLDS } from '../constants/thresholds';
import { AnomalyFlag, ZoneSummary, DemandForecast, MeterReading, AnomalyStatus } from '../types/meter';
import { seedGridSenseData } from '../data/generators';
import { classifyZoneRisk } from '../utils/riskClassifier';

interface AnomalyFilters {
  types: string[];
  minSeverity: number;
  status: string;
  zoneId: string;
}

interface AppStore {
  selectedZone: string | null;
  setSelectedZone: (zoneId: string | null) => void;

  forecastHorizon: '6h' | '24h' | '48h';
  setForecastHorizon: (h: '6h' | '24h' | '48h') => void;

  anomalyFilters: AnomalyFilters;
  setAnomalyFilters: (filters: Partial<AnomalyFilters>) => void;

  thresholds: ThresholdConfig;
  updateThreshold: (key: keyof ThresholdConfig, value: number) => void;

  anomalyFlags: AnomalyFlag[];
  dismissFlag: (flagId: string, reason: string, notes?: string) => void;
  confirmFlag: (flagId: string) => void;

  zones: ZoneSummary[];
  readings: MeterReading[];
  forecasts: DemandForecast[];
}

const initialData = seedGridSenseData();

// Apply risk classification to initial zones
initialData.zones = initialData.zones.map(z => ({
  ...z,
  riskLevel: classifyZoneRisk(z, DEFAULT_THRESHOLDS)
}));

export const useAppStore = create<AppStore>((set) => ({
  selectedZone: null,
  setSelectedZone: (zoneId) => set({ selectedZone: zoneId }),

  forecastHorizon: '24h',
  setForecastHorizon: (h) => set({ forecastHorizon: h }),

  anomalyFilters: {
    types: [],
    minSeverity: 0,
    status: 'ALL',
    zoneId: 'ALL'
  },
  setAnomalyFilters: (filters) => set((state) => ({ anomalyFilters: { ...state.anomalyFilters, ...filters } })),

  thresholds: DEFAULT_THRESHOLDS,
  updateThreshold: (key, value) => set((state) => {
    const newThresholds = { ...state.thresholds, [key]: value };
    return {
      thresholds: newThresholds,
      zones: state.zones.map(z => ({
        ...z,
        riskLevel: classifyZoneRisk(z, newThresholds)
      }))
    };
  }),

  anomalyFlags: initialData.anomalyFlags,
  dismissFlag: (flagId) => set((state) => ({
    anomalyFlags: state.anomalyFlags.map(f => f.flagId === flagId ? { ...f, status: AnomalyStatus.DISMISSED } : f)
  })),
  confirmFlag: (flagId) => set((state) => ({
    anomalyFlags: state.anomalyFlags.map(f => f.flagId === flagId ? { ...f, status: AnomalyStatus.CONFIRMED } : f)
  })),

  zones: initialData.zones,
  readings: initialData.readings,
  forecasts: initialData.forecasts
}));
