import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Zap, HelpCircle } from 'lucide-react';
import { ZoneRiskLevel, AnomalyStatus, FalsePositiveRisk } from '../../types/meter';

interface StatusBadgeProps {
  status: ZoneRiskLevel | AnomalyStatus | FalsePositiveRisk | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse }) => {
  let bgClass;
  let textClass;
  let borderClass;
  let Icon = HelpCircle;

  switch (status) {
    case ZoneRiskLevel.CRITICAL:
    case AnomalyStatus.OPEN:
    case 'TAMPER_SUSPECTED':
      bgClass = 'bg-risk-critical/20';
      textClass = 'text-risk-critical';
      borderClass = 'border-risk-critical';
      Icon = ShieldAlert;
      pulse = pulse || status === ZoneRiskLevel.CRITICAL;
      break;
    case ZoneRiskLevel.HIGH:
    case FalsePositiveRisk.HIGH:
      bgClass = 'bg-risk-high/15';
      textClass = 'text-risk-high';
      borderClass = 'border-risk-high';
      Icon = AlertTriangle;
      break;
    case ZoneRiskLevel.MODERATE:
    case FalsePositiveRisk.MEDIUM:
      bgClass = 'bg-risk-moderate/15';
      textClass = 'text-risk-moderate';
      borderClass = 'border-risk-moderate';
      Icon = Zap;
      break;
    case ZoneRiskLevel.LOW:
    case AnomalyStatus.DISMISSED:
    case FalsePositiveRisk.LOW:
      bgClass = 'bg-risk-low/15';
      textClass = 'text-risk-low';
      borderClass = 'border-risk-low';
      Icon = CheckCircle2;
      break;
    default:
      bgClass = 'bg-grid-slate';
      textClass = 'text-text-secondary';
      borderClass = 'border-border-subtle';
  }

  const baseClasses = `inline-flex items-center gap-1.5 rounded-sm border font-sans uppercase font-medium`;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';
  const pulseClass = pulse ? 'animate-pulse-alert' : '';

  return (
    <span className={`${baseClasses} ${sizeClasses} ${bgClass} ${textClass} ${borderClass} ${pulseClass}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {status ? String(status).replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
};
