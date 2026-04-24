import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ExplainabilityTooltip } from '../shared/ExplainabilityTooltip';

export const ZoneRiskMap: React.FC = () => {
  const { zones, setSelectedZone, selectedZone } = useAppStore();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-risk-critical';
      case 'HIGH': return 'bg-risk-high';
      case 'MODERATE': return 'bg-risk-moderate';
      case 'LOW': return 'bg-risk-low';
      default: return 'bg-grid-slate';
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2">
      {zones.map((zone) => (
        <ExplainabilityTooltip 
          key={zone.id}
          explanation={`Risk level is ${zone.riskLevel} due to load of ${zone.currentLoad.toFixed(0)} kWh and ${zone.activeAnomalyCount} active anomalies.`}
        >
          <button
            onClick={() => setSelectedZone(zone.id)}
            className={`p-3 rounded-lg border text-left transition-all w-full ${selectedZone === zone.id ? 'border-cyan-electric ring-1 ring-cyan-electric' : 'border-border-subtle hover:border-border-active'} ${getRiskColor(zone.riskLevel)}/20 relative overflow-hidden group`}
          >
            <div className="relative z-10">
              <div className="text-[10px] font-mono text-text-secondary">{zone.id}</div>
              <div className="text-xs font-sans font-medium text-text-primary truncate">{zone.name}</div>
              <div className="mt-2 text-sm font-mono font-bold text-text-primary">{zone.currentLoad.toFixed(0)}</div>
            </div>
            <div className={`absolute top-0 right-0 w-2 h-full ${getRiskColor(zone.riskLevel)}`}></div>
            {zone.riskLevel === 'CRITICAL' && (
              <div className="absolute inset-0 border-2 border-risk-critical animate-pulse-alert rounded-lg pointer-events-none"></div>
            )}
          </button>
        </ExplainabilityTooltip>
      ))}
    </div>
  );
};
