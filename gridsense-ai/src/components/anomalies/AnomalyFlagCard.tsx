import React from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { ExplainabilityTooltip } from '../shared/ExplainabilityTooltip';

interface Props {
  flag: any; // using any temporarily since type definition needs update
  onDismiss: () => void;
  onConfirm?: () => void;
  onReview?: () => void;
}

export const AnomalyFlagCard: React.FC<Props> = ({ flag, onDismiss, onConfirm, onReview }) => {
  const isConfirmed = flag.status === 'CONFIRMED';
  const isDismissed = flag.status === 'DISMISSED';

  const borderColor = isConfirmed ? 'border-l-risk-critical' : 'border-l-risk-moderate';
  const opacity = isDismissed ? 'opacity-50' : '';

  return (
    <div className={`p-4 bg-grid-panel border border-border-subtle rounded-lg border-l-4 ${borderColor} ${opacity} transition-all mb-4 shadow-sm`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={flag.anomaly_type} />
          <span className="font-mono text-sm text-text-primary">{flag.meter_id}</span>
          <span className="text-sm font-sans text-text-muted">{flag.zone_id}</span>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={flag.status} size="sm" />
          <span className="text-xs font-mono text-text-muted mt-0.5">
            {new Date(flag.detected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
      </div>

      <div className="mb-4 text-sm font-sans text-text-secondary leading-relaxed bg-grid-slate/30 p-3 rounded-md border border-border-subtle">
        {flag.explanation}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Severity Score</span>
            <span className="text-xs font-mono text-text-primary">{Math.round(flag.severity_score)}/100</span>
          </div>
          <ExplainabilityTooltip explanation={`Based on magnitude of deviation (${flag.baseline_deviation_pct ?? flag.baseline_deviation}%) and confidence of detection.`}>
            <div className="w-full bg-grid-slate h-2 rounded-full overflow-hidden cursor-help">
              <div 
                className={`h-full ${flag.severity_score >= 80 ? 'bg-risk-critical' : 'bg-risk-moderate'}`} 
                style={{ width: `${flag.severity_score}%` }}
              ></div>
            </div>
          </ExplainabilityTooltip>
        </div>
        <div>
          <span className="text-xs font-medium text-text-secondary block mb-1">False Positive Risk</span>
          <ExplainabilityTooltip explanation="High risk means only one low-confidence signal was triggered. Low risk means multiple methods agreed.">
            <div className="cursor-help inline-block">
              <StatusBadge status={flag.false_positive_risk || flag.estimated_false_positive_risk} size="sm" />
            </div>
          </ExplainabilityTooltip>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {flag.contributing_features?.map((feat: string, i: number) => (
          <span key={i} className="text-[10px] font-sans bg-cyan-electric/10 text-cyan-electric px-2 py-1 rounded">
            {feat}
          </span>
        ))}
      </div>

      {!isDismissed && (
        <div className="flex gap-3 pt-3 border-t border-border-subtle">
          {flag.status !== 'UNDER_REVIEW' && (
            <button 
              onClick={onReview}
              className="px-3 py-1.5 bg-cyan-electric text-text-inverse text-sm font-medium rounded hover:bg-cyan-dim transition-colors"
            >
              Review Flag
            </button>
          )}
          {!isConfirmed && (
            <button 
              onClick={onConfirm}
              className="px-3 py-1.5 bg-risk-moderate text-text-inverse text-sm font-medium rounded hover:bg-risk-critical transition-colors"
            >
              Confirm
            </button>
          )}
          <button onClick={onDismiss} className="px-3 py-1.5 bg-transparent border border-transparent text-text-secondary text-sm font-medium rounded hover:text-text-primary hover:bg-grid-slate transition-colors">
            Dismiss &darr;
          </button>
        </div>
      )}
    </div>
  );
};
