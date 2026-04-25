import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useZones } from '../../hooks/useZones';
import { ExplainabilityTooltip } from '../shared/ExplainabilityTooltip';
import { SkeletonLoader } from '../shared/SkeletonLoader';

export const ZoneRiskMap: React.FC = () => {
  const { setSelectedZone, selectedZone } = useAppStore();
  const { data: zones, isLoading } = useZones();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-risk-critical';
      case 'HIGH': return 'bg-risk-high';
      case 'MODERATE': return 'bg-risk-moderate';
      case 'LOW': return 'bg-risk-low';
      default: return 'bg-grid-slate';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[...Array(12)].map((_, i) => <SkeletonLoader key={i} className="h-20" />)}
      </div>
    );
  }

  // Group zones by region for a geographical approximate layout (4x3)
  const regionOrder = ['N', 'C', 'E', 'W', 'S'];
  const sortedZones = [...(zones || [])].sort((a, b) => {
    const aRegion = a.region || 'C';
    const bRegion = b.region || 'C';
    return regionOrder.indexOf(aRegion) - regionOrder.indexOf(bRegion);
  });

  return (
    <div className="grid grid-cols-3 gap-2">
      {sortedZones.map((zone) => (
        <ExplainabilityTooltip 
          key={zone.id}
          explanation={`Risk level is ${zone.risk_level} due to load of ${zone.current_load_kwh?.toFixed(0) || 0} kWh and ${zone.active_meter_count} active meters.`}
        >
          <button
            onClick={() => setSelectedZone(zone.id)}
            className={`p-2 rounded-lg border text-left transition-all w-full h-full ${selectedZone === zone.id ? 'border-cyan-electric ring-1 ring-cyan-electric' : 'border-border-subtle hover:border-border-active'} ${getRiskColor(zone.risk_level)}/20 relative overflow-hidden group flex flex-col justify-between`}
          >
            <div className="relative z-10">
              <div className="text-[9px] font-mono text-text-secondary leading-tight">{zone.id}</div>
              <div className="text-[10px] font-sans font-medium text-text-primary truncate">{zone.name}</div>
            </div>
            <div className="mt-1 relative z-10">
              <div className="text-xs font-mono font-bold text-text-primary">{zone.current_load_kwh?.toFixed(0) || '-'}</div>
            </div>
            <div className={`absolute top-0 right-0 w-1 h-full ${getRiskColor(zone.risk_level)}`}></div>
            {zone.risk_level === 'CRITICAL' && (
              <div className="absolute inset-0 border border-risk-critical animate-pulse-alert rounded-lg pointer-events-none"></div>
            )}
          </button>
        </ExplainabilityTooltip>
      ))}
    </div>
  );
};
