import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  delta?: string;
}

export const KPICard: React.FC<Props> = ({ title, value, icon: Icon, delta }) => {
  return (
    <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg shadow-[0_4px_24px_rgba(0,229,255,0.04)] hover:border-border-active transition-colors duration-150 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2 relative z-10">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <Icon className="text-cyan-electric" size={20} />
      </div>
      <div className="text-3xl font-mono font-bold text-text-primary data-value relative z-10">
        {value}
      </div>
      {delta && (
        <div className="mt-2 text-xs font-sans text-text-muted relative z-10">
          {delta}
        </div>
      )}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-cyan-electric/5 rounded-full blur-xl z-0"></div>
    </div>
  );
};
