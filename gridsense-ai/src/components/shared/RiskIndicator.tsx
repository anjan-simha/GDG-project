import React from 'react';
import { ZoneRiskLevel } from '../../types/meter';

interface Props {
  level: ZoneRiskLevel;
}

export const RiskIndicator: React.FC<Props> = ({ level }) => {
  let color = '';
  switch(level) {
    case ZoneRiskLevel.CRITICAL: color = 'bg-risk-critical'; break;
    case ZoneRiskLevel.HIGH: color = 'bg-risk-high'; break;
    case ZoneRiskLevel.MODERATE: color = 'bg-risk-moderate'; break;
    case ZoneRiskLevel.LOW: color = 'bg-risk-low'; break;
  }
  return <div className={`w-3 h-3 rounded-full ${color} ${level === ZoneRiskLevel.CRITICAL ? 'animate-pulse-alert' : ''}`}></div>;
}
