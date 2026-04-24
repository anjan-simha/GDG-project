export interface ZoneData {
  id: string;
  name: string;
  baseKWh: [number, number];
}

export const ZONES: ZoneData[] = [
  { id: 'BLR-N01', name: 'Rajajinagar',    baseKWh: [80, 120]  },
  { id: 'BLR-N02', name: 'Malleshwaram',   baseKWh: [60, 95]   },
  { id: 'BLR-E01', name: 'Indiranagar',    baseKWh: [100, 160] },
  { id: 'BLR-E02', name: 'Whitefield',     baseKWh: [140, 220] },
  { id: 'BLR-E03', name: 'Marathahalli',   baseKWh: [90, 140]  },
  { id: 'BLR-S01', name: 'Jayanagar',      baseKWh: [75, 115]  },
  { id: 'BLR-S02', name: 'BTM Layout',     baseKWh: [85, 130]  },
  { id: 'BLR-S03', name: 'Electronic City',baseKWh: [200, 350] },
  { id: 'BLR-W01', name: 'Vijayanagar',    baseKWh: [70, 110]  },
  { id: 'BLR-W02', name: 'Nagarbhavi',     baseKWh: [55, 85]   },
  { id: 'BLR-C01', name: 'Shivajinagar',   baseKWh: [120, 180] },
  { id: 'BLR-C02', name: 'Ulsoor',         baseKWh: [95, 145]  },
];
